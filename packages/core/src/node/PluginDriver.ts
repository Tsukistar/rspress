import type {
  PageIndexInfo,
  RouteMeta,
  RspressPlugin,
  UserConfig,
} from '@rspress/shared';
import type { RouteService } from './route/RouteService';

type RspressPluginHookKeys =
  | 'beforeBuild'
  | 'config'
  | 'afterBuild'
  | 'addPages'
  | 'addRuntimeModules'
  | 'routeGenerated'
  | 'routeServiceGenerated'
  | 'extendPageData'
  | 'modifySearchIndexData';

export class PluginDriver {
  #config: UserConfig;
  #configFilePath: string;

  #plugins: RspressPlugin[];

  #isProd: boolean;

  constructor(config: UserConfig, configFilePath: string, isProd: boolean) {
    this.#config = config;
    this.#configFilePath = configFilePath;
    this.#isProd = isProd;
    this.#plugins = [];
  }

  getConfigFilePath() {
    return this.#configFilePath;
  }

  // The init function is used to initialize the doc plugins and will execute before the build process.
  async init() {
    // Clear RspressPlugins first, for the watch mode
    this.clearPlugins();
    const config = this.#config;
    const themeConfig = config?.themeConfig || {};
    const enableLastUpdated =
      themeConfig?.lastUpdated ||
      themeConfig?.locales?.some(locale => locale.lastUpdated);
    const mediumZoomConfig = config?.mediumZoom ?? true;
    if (enableLastUpdated) {
      const { pluginLastUpdated } = await import('./last-updated/index');
      this.addPlugin(pluginLastUpdated());
    }
    if (mediumZoomConfig) {
      const { pluginMediumZoom } = await import('./medium-zoom/index');
      this.addPlugin(
        pluginMediumZoom(
          typeof mediumZoomConfig === 'object' ? mediumZoomConfig : undefined,
        ),
      );
    }

    (config.plugins || []).forEach(plugin => {
      this.addPlugin(plugin);
    });
  }

  addPlugin(plugin: RspressPlugin) {
    const existedIndex = this.#plugins.findIndex(
      item => item.name === plugin.name,
    );
    // Avoid the duplicated plugin
    if (existedIndex !== -1) {
      throw new Error(`The plugin "${plugin.name}" has been registered`);
    }

    this.#plugins.push(plugin);
  }

  getPlugins() {
    return this.#plugins;
  }

  clearPlugins() {
    this.#plugins = [];
  }

  removePlugin(pluginName: string) {
    const index = this.#plugins.findIndex(item => item.name === pluginName);
    if (index !== -1) {
      this.#plugins.splice(index, 1);
    }
  }

  async modifyConfig() {
    let config = this.#config;

    for (let i = 0; i < this.#plugins.length; i++) {
      const plugin = this.#plugins[i];
      if (typeof plugin.config === 'function') {
        config = await plugin.config(
          config || {},
          {
            addPlugin: this.addPlugin.bind(this),
            removePlugin: (pluginName: string) => {
              const index = this.#plugins.findIndex(
                item => item.name === pluginName,
              );
              this.removePlugin(pluginName);
              if (index <= i && index > 0) {
                i--;
              }
            },
          },
          this.#isProd,
        );
      }
    }
    this.#config = config;
    return this.#config;
  }

  async beforeBuild() {
    return this._runParallelAsyncHook(
      'beforeBuild',
      this.#config || {},
      this.#isProd,
    );
  }

  async afterBuild() {
    return this._runParallelAsyncHook(
      'afterBuild',
      this.#config || {},
      this.#isProd,
    );
  }

  async modifySearchIndexData(pages: PageIndexInfo[]) {
    return this._runParallelAsyncHook(
      'modifySearchIndexData',
      pages,
      this.#isProd,
    );
  }

  async extendPageData(pageData: PageIndexInfo) {
    return this._runParallelAsyncHook('extendPageData', pageData, this.#isProd);
  }

  async addPages() {
    const result = await this._runParallelAsyncHook(
      'addPages',
      this.#config || {},
      this.#isProd,
    );
    return result.flat();
  }

  async routeGenerated(routes: RouteMeta[]) {
    return this._runParallelAsyncHook('routeGenerated', routes, this.#isProd);
  }

  async routeServiceGenerated(routeService: RouteService) {
    return this._runParallelAsyncHook(
      'routeServiceGenerated',
      routeService,
      this.#isProd,
    );
  }

  async addRuntimeModules() {
    const result = await this._runParallelAsyncHook(
      'addRuntimeModules',
      this.#config || {},
      this.#isProd,
    );

    return result.reduce((prev, current) => {
      return {
        ...prev,
        ...current,
      };
    }, {});
  }

  globalUIComponents() {
    const result = this.#plugins.map(plugin => plugin.globalUIComponents || []);
    return result.flat();
  }

  globalStyles(): string[] {
    return this.#plugins
      .filter(plugin => typeof plugin.globalStyles === 'string')
      .map(plugin => plugin.globalStyles) as string[];
  }

  _runParallelAsyncHook<H extends RspressPluginHookKeys>(
    hookName: H,
    ...args: Parameters<Required<RspressPlugin>[H]>
  ): Promise<Awaited<ReturnType<Required<RspressPlugin>[H]>>[]> {
    // @ts-expect-error - FIXME: TS is not able to infer the correct type
    return Promise.all(
      this.#plugins
        .filter(plugin => typeof plugin[hookName] === 'function')
        .map(plugin =>
          plugin[hookName]!(
            // @ts-expect-error - FIXME: TS is not able to infer the correct type
            ...args,
          ),
        ),
    );
  }

  _runSerialAsyncHook<H extends RspressPluginHookKeys>(
    hookName: H,
    ...args: Parameters<Required<RspressPlugin>[H]>
  ) {
    // @ts-expect-error - FIXME: TS is not able to infer the correct type
    return this.#plugins.reduce(async (prev, plugin) => {
      if (typeof plugin[hookName] === 'function') {
        await prev;
        return plugin[hookName](
          // @ts-expect-error - FIXME: TS is not able to infer the correct type
          ...args,
        );
      }
      return prev;
    }, Promise.resolve());
  }
}
