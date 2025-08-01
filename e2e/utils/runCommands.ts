import spawn from 'cross-spawn';
import getRandomPort from 'get-port';
import treeKill from 'tree-kill';

const portMap = new Map();

export interface CommandOptions {
  appDir: string;
  env: Record<string, string>;
}

export type Command =
  | 'dev'
  | `dev -- -c ${string}`
  | 'build'
  | `build -- -c ${string}`
  | 'preview';

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runNpmScript(
  commandName: Command,
  options: CommandOptions,
) {
  const command = commandName.split(' ')[0];
  return new Promise((resolve, reject) => {
    const instance = spawn('npm', ['run', ...commandName.split(' ')], {
      cwd: options.appDir,
      env: {
        TEST: '1',
        ...process.env,
        ...options.env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderrOutput = '';
    instance.stderr!.on('data', chunk => {
      stderrOutput += chunk;
    });

    let didResolve = false;

    async function handleStdout(data) {
      const message = data.toString();
      const markers = {
        dev: /built in/i,
        preview: /Local:/i,
        build: /File (web)/,
      };

      if (markers[command].test(message)) {
        if (!didResolve) {
          didResolve = true;
          resolve(instance);
        }
      }
      process.stdout.write(message);
    }

    instance.stdout!.on('data', handleStdout);

    instance.on('error', error => {
      reject(error);
      process.stderr.write(stderrOutput);
    });

    instance.on('close', (code, signal) => {
      instance.stdout!.removeListener('data', handleStdout);

      if (!didResolve) {
        if (code !== 0) {
          reject(
            new Error(
              `process unexpected exit with code: ${code} signal: ${signal}`,
            ),
          );
        } else {
          resolve(null);
        }
        didResolve = true;
      }
    });
  });
}

export async function runDevCommand(
  appDir: string,
  port: number,
  configFile?: string,
) {
  return runNpmScript(configFile ? `dev -- -c ${configFile}` : 'dev', {
    appDir,
    env: {
      PORT: port.toString(),
      // This is an escape hatch for playwright test, playwright does not support lazyCompilation
      RSPRESS_LAZY_COMPILATION: 'false',
      // FIXME: Rspack's buildDependencies should collected the dependencies of rspress.config.ts, plugins change can not trigger the cache invalidate now
      RSPRESS_PERSISTENT_CACHE: 'false',
    },
  });
}

export async function runBuildCommand(appDir: string, configFile?: string) {
  return runNpmScript(configFile ? `build -- -c ${configFile}` : 'build', {
    appDir,
    env: {},
  });
}

export async function runPreviewCommand(appDir: string, port: number) {
  return runNpmScript('preview', {
    appDir,
    env: {
      PORT: port.toString(),
    },
  });
}

export async function getPort() {
  while (true) {
    const port = await getRandomPort();
    if (!portMap.get(port)) {
      portMap.set(port, 1);
      return port;
    }
  }
}

export async function killProcess(instance) {
  return new Promise((resolve, reject) => {
    if (!instance) {
      resolve(null);
    }

    treeKill(instance.pid, err => {
      if (err) {
        if (
          process.platform === 'win32' &&
          typeof err.message === 'string' &&
          (err.message.includes('no running instance of the task') ||
            err.message.includes('not found'))
        ) {
          // Windows throws an error if the process is already dead
          //
          // Command failed: taskkill /pid 6924 /T /F
          // ERROR: The process with PID 6924 (child process of PID 6736) could not be terminated.
          // Reason: There is no running instance of the task.
          return resolve(null);
        }
        return reject(err);
      }
      return resolve(null);
    });
  });
}
