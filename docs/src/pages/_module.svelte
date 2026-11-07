<script lang="ts">
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
    ScrollGradient,
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
  } from "carbon-components-svelte/src/utils/fuzzy-match.js";
  import Code from "carbon-icons-svelte/lib/Code.svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import LogoGithub from "carbon-icons-svelte/lib/LogoGithub.svelte";
  import { onMount } from "svelte";
  import {
    assertCategoriesCover,
    COMPONENT_CATEGORIES,
  } from "../component-categories";
  import { loadIbmScripts } from "../ibm-scripts";
  import { beforeNavigate, componentPages, goto, isActive } from "../router";
  import { createSearch, type SearchDocument } from "../search";
  import type { CompactPage } from "../search-index";
  import { theme } from "../store";

  type ModuleSearchResult = HeaderSearchResult & { isComponent: boolean };

  /**
   * The search index loads on its own, when the search opens or the page
   * is idle, so it isn't in the site's main chunk.
   */
  let search: ((query: string) => SearchDocument[]) | undefined;
  let searchLoading: Promise<void> | undefined;
  function loadSearch() {
    searchLoading ??= Promise.all([
      import("../SEARCH_INDEX.json"),
      import("../search-index"),
    ]).then(([index, { expandSearchIndex }]) => {
      search = createSearch(expandSearchIndex(index.default as CompactPage[]));
    });
  }

  const deprecated: string[] = [];

  let value = "";
  let active = false;
  let results: ModuleSearchResult[] = [];
  $: if (active || value) loadSearch();
  $: results = search?.(value).slice(0, 10) ?? [];

  // Split the hits into two groups. `search` already ranks and filters, so
  // pass shouldFilter={false} and let `matchQuery` highlight labels.
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

  /**
   * Match `query` against `text` by OR-ing per-term fuzzy matches, mirroring how
   * `search` matches each term independently. A single whole-string match would
   * fail whenever the query spans two displayed fields (e.g. "multiselect bas"
   * matching text "MultiSelect" + description "Basic") or a query term isn't
   * present in this particular field at all.
   */
  function matchQuery(text: string, query: string) {
    const terms = query.trim().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return { matched: true, indices: [] as number[] };
    const indices = new Set<number>();
    let matched = false;
    for (const term of terms) {
      const result = fuzzyMatch(text, term);
      if (result.matched) {
        matched = true;
        for (const i of result.indices) indices.add(i);
      }
    }
    return { matched, indices: [...indices].sort((a, b) => a - b) };
  }

  /** Highlight the current query in arbitrary text (e.g. a description). */
  function highlightHtml(text: string | undefined) {
    if (!text) return "";
    const { matched, indices } = matchQuery(text, value);
    return toHtml(highlightSegments(text, matched ? indices : []));
  }

  let isOpen = false;
  let isSideNavOpen = true;
  let innerWidth = 2048;

  $: isMobile = innerWidth < 1056;
  const componentChildren = componentPages.filter(
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

  // IBM's footer and analytics, in production only.
  onMount(() => (import.meta.env.DEV ? undefined : loadIbmScripts()));

  onMount(() =>
    beforeNavigate(() => {
      if (isMobile) isSideNavOpen = false;
    }),
  );

  onMount(() => {
    // Safari has no `requestIdleCallback`.
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(loadSearch, { timeout: 5000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(loadSearch, 2000);
    return () => clearTimeout(id);
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
    href="/"
    expandedByDefault={true}
    bind:isSideNavOpen
  >
    <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>

    <span slot="platform" class="platform-name" class:hidden={active}>
      Carbon<span class="platform-name-full">&nbsp;Components</span>&nbsp;Svelte
      &nbsp;<code class="code-01 platform-name-version">v{__PKG_VERSION}</code>
    </span>
    <HeaderNav aria-label="Carbon Svelte sections">
      <HeaderNavItem href="/" text="Components" isSelected />
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
        match={matchQuery}
        on:select={(e) => {
          // The menu's items are links, which would navigate natively; go
          // there in the page instead.
          if (!("item" in e.detail) || !e.detail.item.href) return;
          e.detail.event.preventDefault();
          goto(e.detail.item.href);
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

  <SideNav
    class="docs-sidenav"
    bind:isOpen={isSideNavOpen}
    activeItemScrollBlock="center"
    border
  >
    <ScrollGradient color="background" hideStartGradient style="height: 100%">
      <SideNavItems>
        <SideNavLink
          text="Introduction"
          href="/"
          isSelected={$isActive("/", { recursive: false })}
        />
        <SideNavLink
          text="Quick start"
          href="/quick-start"
          isSelected={$isActive("/quick-start")}
        />
        <SideNavLink
          text="Component index"
          href="/component-index"
          isSelected={$isActive("/component-index")}
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
              href={child.path}
              isSelected={$isActive(child.path)}
            />
          {/each}
        {/each}
        <li class="sidenav-bottom-spacer" aria-hidden="true"></li>
      </SideNavItems>
    </ScrollGradient>
  </SideNav>
  <slot />
</Theme>

<footer>
  <dds-footer-container disable-locale-button="true" size="micro"
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
    align-items: baseline;
    gap: 0.5rem;
    min-width: 0;
  }

  :global(.docs-search-hit > span) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(.docs-sidenav > .bx--scroll-gradient) {
    flex: 1 1 0%;
    min-height: 0;
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
