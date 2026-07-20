<script lang="ts">
  import { beforeUrlChange, goto, isActive, node, url } from "@roxi/routify";
  import {
    Header,
    HeaderAction,
    HeaderActionLink,
    HeaderNav,
    HeaderNavItem,
    HeaderPanelDivider,
    HeaderPanelLink,
    HeaderPanelLinks,
    HeaderSearch,
    HeaderUtilities,
    SearchMenuGroup,
    SearchMenuItem,
    SideNav,
    SideNavDivider,
    SideNavItems,
    SideNavLink,
    SkipToContent,
    Text,
    Theme,
  } from "carbon-components-svelte";
  import type { HeaderSearchResult } from "carbon-components-svelte/src/UIShell/HeaderSearch.svelte";
  import {
    fuzzyMatch,
    highlightSegments,
  } from "carbon-components-svelte/src/utils/fuzzyMatch.js";
  import Code from "carbon-icons-svelte/lib/Code.svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import LogoGithub from "carbon-icons-svelte/lib/LogoGithub.svelte";
  import MiniSearch from "minisearch";
  import { onMount, tick } from "svelte";
  import {
    assertCategoriesCover,
    COMPONENT_CATEGORIES,
  } from "../component-categories";
  import { subscribeRoutifyGoto } from "../routify-nav";
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
  const routifyNav = subscribeRoutifyGoto(goto);

  onMount(() => {
    tick().then(() => {
      const selected = document.querySelector(
        '.bx--side-nav [aria-current="page"]',
      );
      selected?.scrollIntoView({ block: "center" });
    });

    return () => {
      routifyNav.unsubscribe();
    };
  });

  const deprecated: string[] = [];

  let value = "";
  let active = false;
  let results: ModuleSearchResult[] = [];
  $: results = miniSearch
    .search(value)
    .slice(0, 10)
    .map(
      (r): ModuleSearchResult => ({
        id: String(r.id),
        href: String(r.href),
        text: String(r.text),
        description: r.description == null ? undefined : String(r.description),
        isComponent: Boolean(r.isComponent),
      }),
    );

  // Split MiniSearch hits into two groups. MiniSearch already ranks and filters,
  // so pass shouldFilter={false} and let the default matcher highlight labels.
  $: componentHits = results.filter((r) => r.isComponent);
  $: sectionHits = results.filter((r) => !r.isComponent);

  /** Build highlighted label HTML from `segments`. */
  function toHtml(segments: { text: string; match: boolean }[]) {
    return segments
      .map((s) => {
        const escaped = s.text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        return s.match
          ? `<strong class="bx--search-menu-item__highlight">${escaped}</strong>`
          : escaped;
      })
      .join("");
  }

  /** Highlight the current query in arbitrary text (e.g. a description). */
  function highlightHtml(text: string | undefined) {
    if (!text) return "";
    const { matched, indices } = fuzzyMatch(text, value);
    return toHtml(highlightSegments(text, matched ? (indices ?? []) : []));
  }

  let isOpen = false;
  let isSideNavOpen = true;
  let innerWidth = 2048;

  $: isMobile = innerWidth < 1056;
  $: components = $node.children.find((child) => child.name === "components");

  $: componentChildren = (components?.children ?? []).filter(
    (child) => !deprecated.includes(child.name),
  );

  $: if (import.meta.env.DEV && componentChildren.length) {
    assertCategoriesCover(componentChildren.map((child) => child.name));
  }

  $: nodeByName = new Map(
    componentChildren.map((child) => [child.name, child]),
  );
  $: groupedNav = (() => {
    const groups = COMPONENT_CATEGORIES.map((category) => ({
      label: category.label,
      children: category.components
        .map((name) => nodeByName.get(name))
        .filter((child) => child != null),
    })).filter((group) => group.children.length > 0);

    const categorized = new Set(
      COMPONENT_CATEGORIES.flatMap((category) => category.components),
    );
    const uncategorized = componentChildren.filter(
      (child) => !categorized.has(child.name),
    );
    if (uncategorized.length) {
      groups.push({ label: "Other", children: uncategorized });
    }
    return groups;
  })();

  $beforeUrlChange(() => {
    if (isMobile) isSideNavOpen = false;
    return true;
  });

  function subheadingClass(index: number) {
    return index === 0
      ? "sidenav-subheading sidenav-subheading-first"
      : "sidenav-subheading";
  }
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
      &nbsp;<code class="code-01 platform-name-version">v{__PKG_VERSION}</code>
    </span>
    <HeaderNav aria-label="Carbon Svelte sections">
      <HeaderNavItem href={$url("/")} text="Components" isSelected />
      <HeaderNavItem
        href="https://github.com/carbon-design-system/carbon-icons-svelte"
        target="_blank"
        text="Icons"
        icon={Launch}
      />
      <HeaderNavItem
        href="https://github.com/carbon-design-system/carbon-pictograms-svelte"
        target="_blank"
        text="Pictograms"
        icon={Launch}
      />
    </HeaderNav>
    <HeaderUtilities>
      <HeaderSearch
        bind:value
        bind:active
        placeholder="Search"
        spellcheck="false"
        shouldFilter={false}
        on:select={(e) => {
          // Selecting a link item would navigate natively; intercept it and
          // route through Routify for SPA navigation instead.
          e.detail.event?.preventDefault();
          const href = e.detail.item.href;
          // Hash must not be part of the path: getChainTo treats "/" segments literally,
          // so "Toolbar#slug" would not match the Toolbar route node.
          const u = new URL(href, window.location.origin);
          const path = u.pathname;
          const hash = u.hash.slice(1);
          routifyNav.getNavigate()?.(path, hash ? { "#": hash } : undefined);
        }}
      >
        <svelte:fragment slot="menu">
          {#if componentHits.length}
            <SearchMenuGroup label="Components">
              {#each componentHits as hit (hit.id)}
                <SearchMenuItem text={hit.text} href={hit.href} icon={Code} />
              {/each}
            </SearchMenuGroup>
          {/if}

          {#if sectionHits.length}
            <SearchMenuGroup label="Sections">
              {#each sectionHits as hit (hit.id)}
                <SearchMenuItem
                  text={hit.text}
                  href={hit.href}
                  icon={Document}
                  let:segments
                >
                  <span class="docs-search-hit"
                    ><span>{@html toHtml(segments)}</span>
                    {#if hit.description}
                      <span class="bx--header-search-menu-description"
                        >{@html highlightHtml(hit.description)}</span
                      >
                    {/if}</span
                  >
                </SearchMenuItem>
              {/each}
            </SearchMenuGroup>
          {/if}
        </svelte:fragment>

        <svelte:fragment slot="noResults">No results</svelte:fragment>
      </HeaderSearch>
      <HeaderActionLink
        icon={LogoGithub}
        href="https://github.com/carbon-design-system/carbon-components-svelte"
        target="_blank"
        aria-label="Carbon Components Svelte on GitHub"
      />
      <HeaderAction transition={false} bind:isOpen>
        <HeaderPanelLinks>
          <HeaderPanelDivider>GitHub repositories</HeaderPanelDivider>
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

  <SideNav class="docs-sidenav" bind:isOpen={isSideNavOpen}>
    <SideNavItems>
      <SideNavLink
        text="Introduction"
        href={$url("/")}
        isSelected={$isActive($url("/"), {}, { recursive: false })}
      />
      <SideNavLink
        text="Quick start"
        href={$url("/quick-start")}
        isSelected={$isActive($url("/quick-start"))}
      />
      <SideNavLink
        text="Component index"
        href={$url("/component-index")}
        isSelected={$isActive($url("/component-index"))}
      />
      <SideNavLink
        text="Utility index"
        href={$url("/utility-index")}
        isSelected={$isActive($url("/utility-index"))}
      />
      <SideNavDivider />
      {#each groupedNav as group, groupIndex (group.label)}
        <Text
          tag="li"
          type="label-01"
          color="secondary"
          class={subheadingClass(groupIndex)}
        >
          {group.label}
        </Text>
        {#each group.children as child (child.path)}
          <SideNavLink
            text={child.name}
            href={$url(child.path)}
            isSelected={$isActive($url(child.path))}
          />
        {/each}
      {/each}
      <li class="sidenav-bottom-spacer" aria-hidden="true"></li>
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
          ibm: { siteId: `IBM_${_ibmAnalytics.settings.name}` },
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
    white-space: nowrap;
  }

  .platform-name-version {
    color: var(--cds-text-secondary);
    font-family: var(--cds-code-01-font-family);
  }

  @media (max-width: 1056px) {
    .platform-name-version {
      display: none;
    }

    .platform-name-full {
      display: none;
    }
  }

  :global(.docs-search-hit) {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  :global(.docs-search-hit > span) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(.bx--side-nav__items .bx--side-nav__divider) {
    margin: 1rem 1rem 0;
  }

  :global(.sidenav-subheading) {
    padding: 1.25rem 1rem 0.25rem;
  }

  :global(.sidenav-subheading-first) {
    padding-top: 0.75rem;
  }

  :global(.sidenav-bottom-spacer) {
    height: 2rem;
  }

  @media (min-width: 1056px) {
    footer {
      margin-left: 256px;
    }
  }
</style>
