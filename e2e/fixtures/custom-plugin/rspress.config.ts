import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginPreview } from '@rspress/plugin-preview';
import { docPluginDemo } from './plugin';
// import { pluginPlayground } from '@rspress/plugin-playground';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [
    docPluginDemo(),
    pluginPreview({
      isMobile: true,
      iframeOptions: {
        framework: 'react',
      },
      iframePosition: 'fixed',
      previewLanguages: ['jsx', 'tsx', 'json'],
      previewCodeTransform(codeInfo) {
        if (codeInfo.language === 'json') {
          return `
import React from 'react';

const json = ${codeInfo.code};

export default function() {
  return React.createElement(json.type, null, json.children);
}
`;
        }
        return codeInfo.code;
      },
    }),
    // pluginPlayground(),
  ],
});
