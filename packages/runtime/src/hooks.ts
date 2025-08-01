import type { PageData } from '@rspress/shared';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import i18nTextData from 'virtual-i18n-text';

// Type shim for window.__EDEN_PAGE_DATA__
declare global {
  interface Window {
    __MODERN_PAGE_DATA__: any;
  }
}
interface IDataContext {
  data: PageData;
  setData?: (data: PageData) => void;
}

interface IThemeContext {
  theme: 'light' | 'dark';
  setTheme?: (theme: 'light' | 'dark') => void;
}

export const DataContext = createContext({} as IDataContext);

export const ThemeContext = createContext({} as IThemeContext);

export function usePageData(): PageData {
  const ctx = useContext(DataContext);
  return ctx.data;
}

export function useLang(): string {
  const ctx = useContext(DataContext);
  return ctx.data.page.lang || '';
}

export function useVersion(): string {
  const ctx = useContext(DataContext);
  return ctx.data.page.version || '';
}

export function useDark() {
  const ctx = useContext(ThemeContext);
  return ctx.theme === 'dark';
}

export function useI18n<T = Record<string, Record<string, string>>>() {
  const lang = useLang();

  return useCallback((key: keyof T) => i18nTextData[key][lang], [lang]);
}

export function useViewTransition(dom: ReactNode) {
  /**
   * use a pseudo element to hold the actual JSX element so we can schedule the
   * update later in sync
   */
  const [element, setElement] = useState(dom);

  useLayoutEffect(() => {
    if (document.startViewTransition && element !== dom) {
      /**
       * the browser will take a screenshot here
       */
      document.startViewTransition(() => {
        /**
         * react will batch all the updates in callback and flush it sync
         */
        flushSync(() => {
          setElement(dom);
        });
        /**
         * react flushed the dom to browser
         * and the browser will start the animation
         */
        /**
         * dispatchEvent for several logic
         */
        window.dispatchEvent(new Event('RspressReloadContent'));
      });
    } else {
      flushSync(() => {
        setElement(dom);
      });
      /**
       * dispatchEvent for several logic
       */
      window.dispatchEvent(new Event('RspressReloadContent'));
    }
  }, [dom]);
  /**
   * take this element to the actual V-DOM tree
   */
  return element;
}

export function useWindowSize(initialWidth?: number, initialHeight?: number) {
  const [size, setSize] = useState({
    width: initialWidth ?? Number.POSITIVE_INFINITY,
    height: initialHeight ?? Number.POSITIVE_INFINITY,
  });

  useLayoutEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    // first initialization
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}
