import {
  HomeLayout as BasicHomeLayout,
  Layout as BasicLayout,
  getCustomMDXComponent,
} from '@rspress/core/theme';
import {
  Search as PluginAlgoliaSearch,
  ZH_LOCALES,
} from '@rspress/plugin-algolia/runtime';
import { Announcement } from '@rstack-dev/doc-ui/announcement';
import { NavIcon } from '@rstack-dev/doc-ui/nav-icon';
import { ToolStack } from './components/ToolStack';

import './index.css';
import { NoSSR, useLang } from '@rspress/core/runtime';

function HomeLayout() {
  const { pre: PreWithCodeButtonGroup, code: Code } = getCustomMDXComponent();
  return (
    <BasicHomeLayout
      afterFeatures={<ToolStack />}
      afterHeroActions={
        <div
          className="rspress-doc"
          style={{ minHeight: 'auto', width: '100%', maxWidth: 400 }}
        >
          <PreWithCodeButtonGroup
            containerElementClassName="language-bash"
            codeButtonGroupProps={{
              showCodeWrapButton: false,
            }}
          >
            <Code className="language-bash" style={{ textAlign: 'center' }}>
              npm create rspress@beta
            </Code>
          </PreWithCodeButtonGroup>
        </div>
      }
    />
  );
}

const Layout = () => {
  const lang = useLang();
  return (
    <BasicLayout
      beforeNavTitle={<NavIcon />}
      beforeNav={
        <NoSSR>
          <Announcement
            href="/"
            message={
              lang === 'en'
                ? '🚧 Rspress 2.0 document is under development'
                : '🚧 Rspress 2.0 文档还在开发中'
            }
            localStorageKey="rspress-announcement-closed"
          />
        </NoSSR>
      }
    />
  );
};

const Search = () => {
  const lang = useLang();
  return (
    <PluginAlgoliaSearch
      docSearchProps={{
        appId: 'DIDX9ZTSBM', // cspell:disable-line
        apiKey: 'd33cfed9ffae0e79412cfc3785d3a67f', // cspell:disable-line
        indexName: 'rspress-v2-crawler-doc_search_rspress_v2_pages',
        searchParameters: {
          facetFilters: [`lang:${lang}`],
        },
      }}
      locales={ZH_LOCALES}
    />
  );
};

export { Layout, HomeLayout, Search };
export * from '@rspress/core/theme';
