import {
  addLeadingSlash,
  type DefaultThemeConfig,
  isExternalUrl,
  type NavItem,
  type NavItemWithLink,
  type NormalizedDefaultThemeConfig,
  type NormalizedSidebarGroup,
  type Sidebar,
  type SidebarDivider,
  type SidebarGroup,
  type SidebarItem,
  type SidebarSectionHeader,
  slash,
  type UserConfig,
} from '@rspress/shared';
import { applyReplaceRules } from '../../utils/applyReplaceRules';
import { getI18nData } from '../i18n';

export function normalizeThemeConfig(
  docConfig: UserConfig,
): NormalizedDefaultThemeConfig {
  const {
    locales: siteLocales,
    lang,
    replaceRules = [],
    multiVersion,
  } = docConfig;
  const { versions = [] } = multiVersion || {};
  const hasMultiVersion = versions.length > 0;
  docConfig.themeConfig = docConfig.themeConfig || {};
  const { themeConfig } = docConfig;
  const locales = siteLocales ?? (themeConfig?.locales || []);
  const i18nTextData = getI18nData(docConfig);
  // In following code, we will normalize the theme config reference to the pages data extracted from mdx files
  const normalizeLinkPrefix = (link = '', currentLang = '') => {
    const normalizedLink = slash(link);
    if (
      !currentLang ||
      !link ||
      normalizedLink.startsWith(`/${currentLang}`) ||
      isExternalUrl(normalizedLink) ||
      hasMultiVersion
    ) {
      return normalizedLink;
    }
    // if lang exists, we should add the lang prefix to the link
    // such /guide -> /en/guide
    return lang === currentLang
      ? normalizedLink
      : `/${currentLang}${addLeadingSlash(normalizedLink)}`;
  };

  const getI18nText = (key = '', currentLang = '') => {
    const text = i18nTextData[key]?.[currentLang];
    return text || key;
  };
  // Normalize sidebar
  const normalizeSidebar = (
    sidebar?: DefaultThemeConfig['sidebar'],
    currentLang = '',
  ): NormalizedDefaultThemeConfig['sidebar'] => {
    const normalizedSidebar: NormalizedDefaultThemeConfig['sidebar'] = {};
    if (!sidebar) {
      return {};
    }
    const normalizeSidebarItem = (
      item: SidebarGroup | SidebarItem | SidebarDivider | SidebarSectionHeader,
    ):
      | NormalizedSidebarGroup
      | SidebarItem
      | SidebarDivider
      | SidebarSectionHeader => {
      // Meet the divider, return directly
      if (typeof item === 'object' && 'dividerType' in item) {
        return item;
      }

      // Meet the section header, return i18n text
      if (typeof item === 'object' && 'sectionHeaderText' in item) {
        item.sectionHeaderText = applyReplaceRules(
          getI18nText(item.sectionHeaderText, currentLang),
          replaceRules,
        );
        return item;
      }

      if (typeof item === 'object' && 'items' in item) {
        return {
          ...item,
          text: applyReplaceRules(
            getI18nText(item.text, currentLang),
            replaceRules,
          ),
          link: normalizeLinkPrefix(item.link),
          collapsed: item.collapsed ?? false,
          collapsible: item.collapsible ?? true,
          tag: item.tag,
          items: item.items.map(subItem => {
            return normalizeSidebarItem(subItem) as
              | NormalizedSidebarGroup
              | SidebarItem;
          }),
        };
      }

      return {
        ...item,
        text: applyReplaceRules(
          getI18nText(item.text, currentLang),
          replaceRules,
        ),
        link: normalizeLinkPrefix(item.link),
        tag: item.tag,
      };
    };

    const normalizeSidebar = (sidebar: Sidebar) => {
      Object.keys(sidebar).forEach(key => {
        const value = sidebar[key];
        normalizedSidebar[key] = value.map(normalizeSidebarItem) as (
          | NormalizedSidebarGroup
          | SidebarItem
        )[];
      });
    };

    normalizeSidebar(sidebar);

    return normalizedSidebar;
  };

  const normalizeNav = (
    nav?: DefaultThemeConfig['nav'],
    currentLang?: string,
  ) => {
    if (!nav) {
      return [];
    }
    const transformNavItem = (navItem: NavItem): NavItem => {
      const text = applyReplaceRules(
        getI18nText(navItem.text, currentLang),
        replaceRules,
      );
      if ('link' in navItem) {
        return {
          ...navItem,
          text,
          link: normalizeLinkPrefix(navItem.link, currentLang),
        };
      }

      if ('items' in navItem) {
        return {
          ...navItem,
          text,
          items: navItem.items.map((item: NavItemWithLink) => {
            return {
              ...item,
              text: applyReplaceRules(
                getI18nText(item.text, currentLang),
                replaceRules,
              ),
              link: normalizeLinkPrefix(item.link, currentLang),
            };
          }),
        };
      }

      return navItem;
    };

    if (Array.isArray(nav)) {
      return nav.map(transformNavItem);
    }

    // Multi version case
    return Object.entries<NavItem[]>(nav).reduce(
      (acc, [key, value]) => {
        acc[key] = value.map(transformNavItem);
        return acc;
      },
      {} as Record<string, NavItem[]>,
    );
  };

  /**
   * There are two place the user will define the locales:
   * 1. in the `doc.locales` (the site config)
   * 2. in the `doc.themeConfig.locales`
   * The locales in the theme config will override the locales in the site config.
   *
   * For nav and sidebar, we prefer the locales in the `themeConfig.nav` and `themeConfig.sidebar` if it exists. And Rspress will generate complete nav and sidebar for each locale and place them in the `themeConfig.locales` field.
   */
  if (locales.length) {
    themeConfig.locales = locales.map(({ lang: currentLang, label }) => {
      const localeInThemeConfig = themeConfig.locales?.find(
        locale => locale.lang === currentLang,
      );
      return {
        lang: currentLang,
        label,
        ...(localeInThemeConfig || {}),
        sidebar: normalizeSidebar(
          localeInThemeConfig?.sidebar ?? themeConfig.sidebar,
          currentLang,
        ),
        nav: normalizeNav(
          localeInThemeConfig?.nav ?? themeConfig.nav,
          currentLang,
        ),
      };
    });
  } else {
    themeConfig.sidebar = normalizeSidebar(themeConfig?.sidebar);
    themeConfig.nav = normalizeNav(themeConfig?.nav);
  }
  return themeConfig as NormalizedDefaultThemeConfig;
}
