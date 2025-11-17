<script>
  import {
    beforeUrlChange,
    goto,
    isActive,
    layout,
    url,
  } from "@sveltech/routify";
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
    Tag,
    Theme,
  } from "carbon-components-svelte";
  import LogoGithub from "carbon-icons-svelte/lib/LogoGithub.svelte";
  import MiniSearch from "minisearch";
  import SEARCH_INDEX from "../SEARCH_INDEX.json";
  import { theme } from "../store";

  const miniSearch = new MiniSearch({
    fields: ["text", "description"],
    storeFields: ["text", "description", "href"],
    searchOptions: {
      prefix: true,
      boost: { description: 2 },
      fuzzy: 0.1,
    },
  });

  miniSearch.addAll(SEARCH_INDEX);

  const deprecated = [];
  const new_components = [];

  let value = "";
  let active = false;
  $: results = miniSearch.search(value).slice(0, 10);

  let isOpen = false;
  let isSideNavOpen = true;
  let innerWidth = 2048;

  $: isMobile = innerWidth < 1056;
  $: components = $layout.children.find(
    (child) => child.title === "components",
  );

  $beforeUrlChange(() => {
    if (isMobile) isSideNavOpen = false;
    return true;
  });
</script>

<!-- routify:options bundle=true -->
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
          ibm: {
            siteId: "IBM_" + _ibmAnalytics.settings.name,
          },
        },
        category: {
          primaryCategory: "PC100",
        },
      },
    };
  </script>
  <script
    type="module"
    defer
    src="https://1.www.s81c.com/common/carbon-for-ibm-dotcom/tag/v1/latest/footer.min.js"
  ></script>
  <script
    src="//1.www.s81c.com/common/stats/ibm-common.js"
    type="text/javascript"
    defer
  ></script>
</svelte:head>

<Theme
  persist
  bind:theme={$theme}
  on:update={(e) => {
    const theme = e.detail.theme;
    document.documentElement.style.setProperty(
      "color-scheme",
      ["white", "g10"].includes(theme) ? "light" : "dark",
    );
  }}
>
  <Header
    aria-label="Navigation"
    href={$url("/")}
    expandedByDefault={true}
    bind:isSideNavOpen
  >
    <svelte:fragment slot="skip-to-content">
      <SkipToContent />
    </svelte:fragment>

    <span slot="platform" class="platform-name" class:hidden={active}>
      Carbon Components Svelte &nbsp;<code class="code-01"
        >v{process.env.VERSION || ""}</code
      >
    </span>
    <HeaderUtilities>
      <HeaderSearch
        bind:value
        bind:active
        placeholder="Search"
        {results}
        on:select={(e) => {
          $goto(e.detail.selectedResult.href);
        }}
      />
      <HeaderActionLink
        icon={LogoGithub}
        href="https://github.com/carbon-design-system/carbon-components-svelte"
        target="_blank"
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
      {#each components.children.filter((child) => !deprecated.includes(child.title)) as child (child.path)}
        <SideNavMenuItem
          text={child.title}
          href={$url(child.path)}
          isSelected={$isActive($url(child.path))}
        >
          {child.title}
          {#if deprecated.includes(child.title)}
            <Tag
              size="sm"
              type="red"
              style="margin-top: 0; margin-bottom: 0; cursor: inherit"
            >
              Deprecated
            </Tag>
          {/if}
          {#if new_components.includes(child.title)}
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

  @media (max-width: 580px) {
    .platform-name code {
      display: none;
    }
  }
</style>
