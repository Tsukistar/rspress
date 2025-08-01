import { extractTextAndId } from '@rspress/shared/node-utils';
import Slugger from 'github-slugger';
import type { Root } from 'hast';
import type { Plugin } from 'unified';
import { visitChildren } from 'unist-util-visit-children';
import type { PageMeta } from '../types';

export interface TocItem {
  id: string;
  text: string;
  depth: number;
}

interface ChildNode {
  type: 'link' | 'text' | 'inlineCode' | 'strong' | 'emphasis' | 'delete';
  value: string;
  children?: ChildNode[];
}

interface Heading {
  type: string;
  depth?: number;
  children?: ChildNode[];
}

export const parseToc = (tree: Root) => {
  let title = '';
  const toc: TocItem[] = [];
  const slugger = new Slugger();
  visitChildren((node: Heading) => {
    if (node.type !== 'heading' || !node.depth || !node.children) {
      return;
    }

    // Collect h1 ~ h4
    if (node.depth >= 1 && node.depth < 5) {
      let customId = '';
      const text = node.children
        .map((child: ChildNode) => {
          if (child.type === 'link') {
            return child.children?.map(item => item.value).join('');
          }
          if (child.type === 'strong') {
            return `**${child.children?.map(item => item.value).join('')}**`;
          }
          if (child.type === 'emphasis') {
            return `*${child.children?.map(item => item.value).join('')}*`;
          }
          if (child.type === 'delete') {
            return `~~${child.children?.map(item => item.value).join('')}~~`;
          }
          if (child.type === 'text') {
            const [textPart, idPart] = extractTextAndId(child.value);
            customId = idPart;
            return textPart;
          }
          if (child.type === 'inlineCode') {
            return `\`${child.value}\``;
          }
          return '';
        })
        .join('');

      if (node.depth === 1) {
        if (!title) title = text;
      } else {
        const id = customId ? customId : slugger.slug(text.trim());
        const { depth } = node;
        toc.push({ id, text, depth });
      }
    }
  })(tree);
  return {
    title,
    toc,
  };
};

export const remarkToc: Plugin<[], Root> = function () {
  const data = this.data() as {
    pageMeta: PageMeta;
  };
  return (tree: Root) => {
    const { toc, title } = parseToc(tree);
    data.pageMeta.toc = toc;
    if (title) {
      data.pageMeta.title = title;
    }
  };
};
