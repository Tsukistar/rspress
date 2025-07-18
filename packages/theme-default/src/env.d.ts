declare module 'virtual-site-data' {
  import { SiteData, DefaultThemeConfig } from '@rspress/shared';

  const data: SiteData<DefaultThemeConfig>;
  export default data;
}

// for the first build when generating the module.scss.d.ts
declare module '*.module.scss';

declare module '@theme-assets/*' {
  const SvgIcon: React.FC<React.SVGProps<SVGSVGElement>> | string;
  export default SvgIcon;
}

declare module '*.svg' {
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module 'virtual-search-hooks' {
  import type {
    BeforeSearch,
    OnSearch,
    AfterSearch,
    RenderSearchFunction,
  } from '@rspress/theme-default';

  export const beforeSearch: BeforeSearch;
  export const onSearch: OnSearch;
  export const afterSearch: AfterSearch;
  export const render: RenderSearchFunction;
}

declare module 'virtual-search-index-hash' {
  const hash: Record<string, string>;
  export default hash;
}

declare const __WEBPACK_PUBLIC_PATH__: string;

declare module 'virtual-runtime-config' {
  import type { NormalizedRuntimeConfig } from '@rspress/shared';

  export const base: NormalizedRuntimeConfig['base'];
}
