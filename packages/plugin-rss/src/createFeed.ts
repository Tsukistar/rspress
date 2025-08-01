import { resolve as resolveUrl } from 'node:url';
import type { PageIndexInfo, UserConfig } from '@rspress/core';
import type { Author, FeedOptions } from 'feed';
import {
  concatArray,
  type ResolvedOutput,
  selectNonNullishProperty,
  toDate,
} from './internals';
import type { FeedChannel, FeedItem } from './type';

/**
 * @public
 * @param page Rspress Page Data
 * @param siteUrl
 */
export function generateFeedItem(page: PageIndexInfo, siteUrl: string) {
  const { frontmatter: fm } = page;
  return {
    id: selectNonNullishProperty(fm.slug, fm.id, page.routePath) || '',
    title: selectNonNullishProperty(fm.title, page.title) || '',
    author: toAuthors(fm.author),
    link: resolveUrl(
      siteUrl,
      selectNonNullishProperty(fm.permalink, page.routePath)?.replace(
        /^\//,
        '',
      ) || '',
    ),
    description: selectNonNullishProperty(fm.description) || '',
    content: selectNonNullishProperty(fm.summary, page._html) || '',
    date: toDate((fm.date as string) || (fm.published_at as string))!,
    category: concatArray(fm.categories as string[], fm.category as string).map(
      cat => ({ name: cat }),
    ),
  } satisfies FeedItem;
}

export function createFeed(
  options: Omit<FeedChannel, 'test' | 'item' | 'output'> & {
    item?: unknown;
    test?: unknown;
    output: ResolvedOutput;
  },
  config: UserConfig,
): FeedOptions {
  const { output, item: _item, id, title, ..._options } = options;
  return {
    id,
    copyright: config.themeConfig?.footer?.message || '',
    description: config.description || '',
    link: output.url,
    ..._options,
    title: title || config.title || '',
  };
}

function toAuthors(author: unknown): Author[] | undefined {
  const authors = (Array.isArray(author) ? author : [author])
    .filter(Boolean)
    .map(author => ({
      // email is mandatory for RSS 2.0.
      ...(typeof author === 'string' ? { name: author } : author),
    }));
  return authors.length ? authors : undefined;
}
