<script lang="ts">
  import { beforeUrlChange, goto, isActive, node, url } from "@roxi/routify";
  import {
    Header,
    HeaderAction,
    HeaderActionLink,
    HeaderPanelDivider,
    HeaderPanelLink,
    HeaderPanelLinks,
    HeaderSearch,
    HeaderUtilities,
    SideNav,
    SideNavItems,
    SideNavMenuItem,
    SkipToContent,
    Stack,
    Tag,
    Theme,
  } from "carbon-components-svelte";
  import type { HeaderSearchResult } from "carbon-components-svelte/src/UIShell/HeaderSearch.svelte";
  import LogoGithub from "carbon-icons-svelte/lib/LogoGithub.svelte";
  import MiniSearch from "minisearch";
  import { onMount, tick } from "svelte";
  import SEARCH_INDEX from "../SEARCH_INDEX.json";
  import { theme } from "../store";

  type ModuleSearchResult = HeaderSearchResult & { isComponent: boolean };

  type SearchIndexDocument = ModuleSearchResult & { id: string };

  const miniSearch = new MiniSearch<SearchIndexDocument>({
    fields: ["text", "description"],
    storeFields: ["text", "description", "href", "isComponent"],
    searchOptions: {
      prefix: true,
      boost: { description: 2 },
      fuzzy: 0.1,
    },
  });

  miniSearch.addAll(SEARCH_INDEX as SearchIndexDocument[]);

  /** Routify + Svelte 5: `$goto` in event handlers runs outside fragment context; keep a root-level subscription. */
  let navigateTo:
    | ((path: string, options?: { "#": string }) => void)
    | undefined;
  const unsubGoto = goto.subscribe((fn) => {
    navigateTo = fn;
  });

  onMount(() => {
    tick().then(() => {
      const selected = document.querySelector(
        '.bx--side-nav [aria-current="page"]',
      );
      selected?.scrollIntoView({ block: "center" });
    });

    return () => {
      unsubGoto();
    };
  });

  const deprecated: string[] = [];
  const new_components: string[] = [];

  let value = "";
  let active = false;
  let results: ModuleSearchResult[] = [];
  $: results = miniSearch
    .search(value)
    .slice(0, 10)
    .map(
      (r): ModuleSearchResult => ({
        href: String(r.href),
        text: String(r.text),
        description: r.description == null ? undefined : String(r.description),
        isComponent: Boolean(r.isComponent),
      }),
    );

  let isOpen = false;
  let isSideNavOpen = true;
  let innerWidth = 2048;

  $: isMobile = innerWidth < 1056;
  $: components = $node.children.find((child) => child.name === "components");

  $beforeUrlChange(() => {
    if (isMobile) isSideNavOpen = false;
    return true;
  });
</script>

<svelte:window bind:innerWidth />

<svelte:body
  on:keydown={(e) => {
    if (active) return;
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement
    ) {
      // Exit early if an inputtable element is already focused.
      return;
    }

    const isCommandOrControl = e.metaKey || e.ctrlKey;
    const isCmdK = isCommandOrControl && e.key.toLowerCase() === "k";
    const isSlash = e.key === "/";

    if (isCmdK || isSlash) {
      e.preventDefault();
      active = true;
    }
  }}
/>

<Theme persist bind:theme={$theme}>
  <Header
    aria-label="Navigation"
    href={$url("/")}
    expandedByDefault={true}
    bind:isSideNavOpen
  >
    <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>

    <span slot="platform" class="platform-name" class:hidden={active}>
      Carbon<span class="platform-name-full">&nbsp;Components</span>&nbsp;Svelte
      &nbsp;<code class="code-01">v{__PKG_VERSION}</code>
    </span>
    <HeaderUtilities>
      <HeaderSearch
        bind:value
        bind:active
        placeholder="Search"
        spellcheck="false"
        {results}
        let:result
        on:select={(e) => {
          const href = e.detail.selectedResult.href;
          // Hash must not be part of the path: getChainTo treats "/" segments literally,
          // so "Toolbar#slug" would not match the Toolbar route node.
          const u = new URL(href, window.location.origin);
          const path = u.pathname;
          const hash = u.hash.slice(1);
          navigateTo?.(path, hash ? { "#": hash } : undefined);
        }}
      >
        {@const hit = result as ModuleSearchResult}
        <Stack
          gap={3}
          orientation="horizontal"
          style="display: flex; align-items: center;"
        >
          {hit.text}
          {#if hit.description && !hit.isComponent}
            <span class="bx--header-search-menu-description">
              {hit.description}
            </span>
          {/if}
          {#if hit.isComponent}
            <Tag size="sm" type="blue" style="margin: 0">Component</Tag>
          {/if}
        </Stack>
      </HeaderSearch>
      <HeaderActionLink
        icon={LogoGithub}
        href="https://github.com/carbon-design-system/carbon-components-svelte"
        target="_blank"
        aria-label="Carbon Components Svelte on GitHub"
      />
      <HeaderAction transition={false} bind:isOpen>
        <HeaderPanelLinks>
          <HeaderPanelDivider>Carbon Svelte portfolio</HeaderPanelDivider>
          <HeaderPanelLink
            href="https://github.com/carbon-design-system/carbon-icons-svelte"
          >
            Carbon Icons Svelte
          </HeaderPanelLink>
          <HeaderPanelLink
            href="https://github.com/carbon-design-system/carbon-pictograms-svelte"
          >
            Carbon Pictograms Svelte
          </HeaderPanelLink>
          <HeaderPanelLink
            href="https://github.com/carbon-design-system/carbon-charts/tree/master/packages/svelte"
          >
            Carbon Charts Svelte
          </HeaderPanelLink>
          <HeaderPanelLink
            href="https://github.com/carbon-design-system/carbon-preprocess-svelte"
          >
            Carbon Preprocess Svelte
          </HeaderPanelLink>
          <HeaderPanelDivider>Resources</HeaderPanelDivider>
          <HeaderPanelLink href="https://www.carbondesignsystem.com/">
            Carbon Design System
          </HeaderPanelLink>
          <HeaderPanelLink href="https://www.ibm.com/design/language/">
            IBM Design Language
          </HeaderPanelLink>
        </HeaderPanelLinks>
      </HeaderAction>
    </HeaderUtilities>
  </Header>

  <SideNav bind:isOpen={isSideNavOpen}>
    <SideNavItems>
      {#each (components?.children ?? []).filter((child) => !deprecated.includes(child.name)) as child (child.path)}
        <SideNavMenuItem
          text={child.name}
          href={$url(child.path)}
          isSelected={$isActive($url(child.path))}
        >
          {child.name}
          {#if deprecated.includes(child.name)}
            <Tag
              size="sm"
              type="red"
              style="margin-top: 0; margin-bottom: 0; cursor: inherit"
            >
              Deprecated
            </Tag>
          {/if}
          {#if new_components.includes(child.name)}
            <Tag
              size="sm"
              type="green"
              style="margin-top: 0; margin-bottom: 0; cursor: inherit"
            >
              New
            </Tag>
          {/if}
        </SideNavMenuItem>
      {/each}
    </SideNavItems>
  </SideNav>
  <slot />
</Theme>

<svelte:head>
  <!-- Tealium/GA Set up -->
  <script type="text/javascript">
    window._ibmAnalytics = {
      settings: {
        name: "CarbonSvelte",
        isSpa: true,
        tealiumProfileName: "ibm-web-app",
      },
      onLoad: [["ibmStats.pageview", []]],
    };
    digitalData = {
      page: {
        pageInfo: {
          ibm: { siteId: "IBM_" + _ibmAnalytics.settings.name },
        },
        category: { primaryCategory: "PC100" },
      },
    };
  </script>
  <script
    type="module"
    src="https://1.www.s81c.com/common/carbon-for-ibm-dotcom/tag/v1/latest/footer.min.js"
    defer
  ></script>
  <script
    src="//1.www.s81c.com/common/stats/ibm-common.js"
    type="text/javascript"
    defer
  ></script>
</svelte:head>

<footer>
  <dds-footer-container
    disable-locale-button="true"
    size="micro"
  ></dds-footer-container>
</footer>

<style>
  /** Hide logo to make space for search bar on narrower screens. */
  @media (max-width: 1056px) {
    .platform-name.hidden {
      display: none;
    }
  }

  .platform-name {
    display: flex;
    align-items: baseline;
  }

  @media (min-width: 1056px) {
    footer {
      margin-left: 256px;
    }
  }

  @media (max-width: 580px) {
    .platform-name code {
      display: none;
    }

    .platform-name-full {
      display: none;
    }
  }
</style>
