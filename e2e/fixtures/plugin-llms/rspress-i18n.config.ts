import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginLlms } from '@rspress/plugin-llms';

export default defineConfig({
  root: path.join(__dirname, 'doc-i18n'),
  lang: 'en',
  themeConfig: {
    darkMode: false,
    locales: [
      {
        lang: 'zh',
        title: '一个很棒的项目',
        description: '一个很棒的项目描述',
        // 语言切换按钮的文案
        // Language switch button text
        label: '简体中文',
      },
      {
        lang: 'en',
        title: 'A awesome project',
        description: 'A awesome project description',
        label: 'English',
      },
    ],
  },
  plugins: [
    pluginLlms([
      {
        llmsTxt: {
          name: 'llms.txt',
        },
        llmsFullTxt: {
          name: 'llms-full.txt',
        },
        include: ({ page }) => page.lang === 'en',
      },
      {
        llmsTxt: {
          name: 'zh/llms.txt',
        },
        llmsFullTxt: {
          name: 'zh/llms-full.txt',
        },
        include: ({ page }) => page.lang === 'zh',
      },
    ]),
  ],
});
