import {
  normalizeRoutePath,
  matchPath as reactRouterDomMatchPath,
} from '@rspress/runtime';
import type {
  NormalizedSidebar,
  NormalizedSidebarGroup,
  SidebarDivider,
  SidebarItem,
  SidebarSectionHeader,
} from '@rspress/shared';
import { matchSidebar } from '@rspress/shared';
import type { SidebarData } from '../components/Sidebar';

/**
 * link: /api/config
 * currentPathname:
 *  0. /api/config
 *  1. /api/config.html
 *  2. /api/config/
 *  3. /api/config/index
 *  4. /api/config/index.html
 * @param itemLink
 * @param currentPathname
 * @returns
 */
export function isActive(itemLink: string, currentPathname: string): boolean {
  const normalizedItemLink = normalizeRoutePath(itemLink);
  const normalizedCurrentPathname = normalizeRoutePath(currentPathname);
  const linkMatched = reactRouterDomMatchPath(
    normalizedItemLink,
    normalizedCurrentPathname,
  );
  return linkMatched !== null;
}

/**
 * get active menuItem of currentPathname
 * @param item
 * @param currentPathname
 * @returns
 */
const _match = (
  item:
    | NormalizedSidebarGroup
    | SidebarItem
    | SidebarDivider
    | SidebarSectionHeader,
  currentPathname: string,
): NormalizedSidebarGroup | SidebarItem | undefined => {
  const isLink = 'link' in item && item.link !== '';
  const isDir = 'items' in item;

  // 0. divider or section headers others return false

  // 1. file link
  if (!isDir && isLink) {
    // 1.1 /api/config /api/config.html
    // 1.2 /api/config/index /api/config/index.html
    if (isActive(item.link, currentPathname)) {
      return item;
    }
  }

  // 2. dir
  if (isDir) {
    // 2.1 dir link (index convention)
    if (isLink && isActive(item.link!, currentPathname)) {
      return item;
    }
    // 2.2 dir recursive
    for (const childItem of item.items) {
      const matched = _match(childItem, currentPathname);
      if (matched) {
        return matched;
      }
    }
  }

  return undefined;
};

/**
 * get the sidebar group for the current page
 * @param sidebar const { sidebar } = useLocaleSiteData();
 * @param currentPathname
 * @returns
 */
export const getSidebarDataGroup = (
  sidebar: NormalizedSidebar,
  currentPathname: string,
): SidebarData => {
  /**
   * why sort?
   * {
   *  '/': [],
   *  '/guide': [
   *    {
   *      text: 'Getting Started',
   *      link: '/guide/getting-started',
   *    }
   *   ],
   * }
   */
  const navRoutes = Object.keys(sidebar).sort((a, b) => b.length - a.length);
  for (const name of navRoutes) {
    if (matchSidebar(name, currentPathname)) {
      const sidebarGroup = sidebar[name];
      return sidebarGroup;
    }
  }
  return [];
};
