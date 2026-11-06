<script>
  /**
   * A catalog browse page: search, facets, sort, a card grid or list, and
   * incremental loading, all driven by one state that lives in the URL.
   *
   * The page never keeps a second copy of that state. Every control calls
   * `navigate`, which writes the URL and then reads the state back from it;
   * the back button reads the same URL.
   */
  import {
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Dropdown,
    EmptyState,
    InlineNotification,
    PageHeader,
    Search,
    SkeletonText,
    ToggleButton,
    ToggleButtonGroup,
  } from "carbon-components-svelte";
  import Filter from "carbon-icons-svelte/lib/Filter.svelte";
  import Grid from "carbon-icons-svelte/lib/Grid.svelte";
  import List from "carbon-icons-svelte/lib/List.svelte";
  import { onMount, tick } from "svelte";
  import AppliedFilters from "../../../src/FilterPanel/AppliedFilters.svelte";
  import FilterFlyout from "../../../src/FilterPanel/FilterFlyout.svelte";
  import FilterPanel from "../../../src/FilterPanel/FilterPanel.svelte";
  import { countFilters } from "../../../src/FilterPanel/filter-model.js";
  import { createResultAnnouncer } from "../../../src/FilterPanel/result-announcer.js";
  import { debounce } from "../../../src/utils/debounce.js";
  import { createVirtualizer } from "../../../src/utils/virtualizer.js";
  import CatalogCard from "./CatalogCard.svelte";
  import { FACETS, SORTS } from "./catalog-data.js";
  import {
    anchorAt,
    readSnapshot,
    scrollForAnchor,
    writeSnapshot,
  } from "./catalog-scroll.js";
  import { loadCatalog } from "./catalog-source.js";
  import {
    formatCatalogUrl,
    parseCatalogUrl,
    sameQuery,
  } from "./catalog-url.js";

  /**
   * Where results come from.
   * @type {import("./catalog-source.js").CatalogSource}
   */
  export let source;

  /**
   * The first load, made on the server: the state it was made for and its
   * result. With it, the first page is in the markup and the browser asks for
   * nothing until the state changes.
   * @type {{ state: import("./catalog-url.js").CatalogState; result: import("./catalog-source.js").CatalogResult } | undefined}
   */
  export let initial = undefined;

  /** The query string to start from, such as `location.search`. */
  export let url = "";

  /** Set to `true` to keep the URL and the browser history in step with the state. */
  export let syncUrl = false;

  /** Items per page. */
  export let pageSize = 24;

  /**
   * Set to `true` to render only the rows in view. The default renders every
   * loaded card.
   */
  export let virtualize = false;

  /**
   * `"infinite"` loads the next page as the end of the list nears; `"button"`
   * waits for "Load more". The button is there in both.
   * @type {"infinite" | "button"}
   */
  export let loadMode = "infinite";

  /**
   * Where a card goes.
   * @type {(item: import("./catalog-data.js").CatalogItem) => string}
   */
  export let itemHref = (item) => `#${item.id}`;

  /** Quiet time in milliseconds before the result count is spoken. */
  export let announceDelay = 800;

  // The card grid: a card is at least this wide, and a row is this far apart.
  // The CSS reads the same two numbers, so a column count worked out here is
  // the one the browser draws.
  const CARD_MIN_REM = 17;
  const GAP_REM = 1;

  const facets = FACETS;

  /** @type {import("./catalog-url.js").CatalogState} */
  let state = initial?.state ?? parseCatalogUrl(url);
  /** @type {import("./catalog-data.js").CatalogItem[]} */
  let items = initial?.result.items ?? [];
  let nextCursor = initial?.result.nextCursor ?? null;
  let total = initial?.result.total ?? 0;
  /** @type {import("../../../src/FilterPanel/filter-model.js").FacetCounts | undefined} */
  let counts = initial?.result.counts;
  /** @type {"idle" | "loading" | "more" | "error"} */
  let status = initial ? "idle" : "loading";
  let hasLoaded = Boolean(initial);
  let searchValue = state.q;
  let mounted = false;
  let flyout = false;
  let flyoutOpen = false;
  /** @type {Set<string>} */
  let favorites = new Set();
  /** @type {Set<string>} */
  let comparing = new Set();

  /** @type {HTMLElement | undefined} */
  let toolbarEl;
  /** @type {HTMLElement | undefined} */
  let resultsEl;
  /** @type {HTMLElement | undefined} */
  let sentinelEl;
  let columns = 3;
  let stride = 224 + 16;
  let cardGap = 16;
  /** Space held under the results while a reader's place is being restored. */
  let reserve = 0;
  let focusedRow = -1;

  /** @type {AbortController | undefined} */
  let controller;
  let token = 0;

  let announcer = createResultAnnouncer(initial?.result.total, announceDelay);

  const rows = createVirtualizer({ count: 0, size: stride, overscan: 1 });

  $: useVirtual = virtualize && mounted;
  $: view = state.view;
  $: filterCount = countFilters(facets, state.filters);
  $: settled = hasLoaded && status !== "loading";
  $: announcer.track(settled ? total : undefined, resultsText);
  $: rowCount = Math.ceil(items.length / columns);
  $: rows.setOptions({
    count: rowCount,
    size: stride,
    keepMounted: focusedRow >= 0 ? [focusedRow] : [],
  });
  $: windowRows = rowsInWindow($rows, rowCount);
  $: if (mounted) measure(view);
  $: skeletonCount = Math.max(columns, 6);

  /** @param {number} count */
  function resultsText(count) {
    return count === 0
      ? "No results"
      : `${count.toLocaleString("en")} ${count === 1 ? "result" : "results"}`;
  }

  /**
   * The rows to draw: the window, plus the row that has focus.
   * @param {import("../../../src/utils/virtualizer.js").VirtualizerState} windowState
   * @param {number} count
   */
  function rowsInWindow(windowState, count) {
    const wanted = new Set(windowState.kept);
    const end = Math.min(windowState.endIndex, count);
    for (let row = windowState.startIndex; row < end; row += 1) wanted.add(row);
    return [...wanted].sort((a, b) => a - b);
  }

  /** @param {import("./catalog-url.js").CatalogState} next */
  const queryKey = (next) =>
    formatCatalogUrl({ ...next, pages: 1, view: "grid" });

  function listTop() {
    return resultsEl
      ? resultsEl.getBoundingClientRect().top + window.scrollY
      : 0;
  }

  function remPx() {
    return (
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
      16
    );
  }

  /**
   * Read the column count and the row height back from the page.
   * @param {"grid" | "list"} [forView]
   */
  function measure(forView = view) {
    if (!resultsEl) return;
    const rem = remPx();
    cardGap = GAP_REM * rem;
    const width = resultsEl.clientWidth;
    columns =
      forView === "list"
        ? 1
        : Math.max(
            1,
            Math.floor((width + cardGap) / (CARD_MIN_REM * rem + cardGap)),
          );
    const card = resultsEl.querySelector(".ccs-catalog-card");
    if (card) {
      const height = card.getBoundingClientRect().height;
      if (height > 0) stride = height + cardGap;
    }
    rows.setViewport(window.innerHeight);
  }

  function onScroll() {
    if (useVirtual) rows.setScroll(window.scrollY - listTop());
    saveSoon();
  }

  function saveNow() {
    if (!syncUrl || !hasLoaded || items.length === 0 || !resultsEl) return;
    const { index, within } = anchorAt({
      scrollY: window.scrollY,
      listTop: listTop(),
      stride,
      columns,
    });
    writeSnapshot({
      key: queryKey(state),
      index: Math.min(index, items.length - 1),
      within,
      y: Math.round(window.scrollY),
    });
  }

  const saveSoon = debounce(saveNow, 400);

  /**
   * Put the reader back where a snapshot says, once the items are drawn.
   * @param {import("./catalog-scroll.js").ScrollSnapshot} snapshot
   */
  async function restore(snapshot) {
    await tick();
    measure();
    await tick();
    const target = scrollForAnchor({
      index: Math.min(snapshot.index, Math.max(0, items.length - 1)),
      within: snapshot.within,
      listTop: listTop(),
      stride,
      columns,
    });
    reserve = 0;
    window.scrollTo(0, target);
    if (useVirtual) rows.setScroll(target - listTop());
  }

  /**
   * @param {import("./catalog-url.js").CatalogState} next
   * @param {{ restore?: import("./catalog-scroll.js").ScrollSnapshot | null }} [options]
   */
  async function load(next, options = {}) {
    controller?.abort();
    const mine = ++token;
    controller = new AbortController();
    status = "loading";
    try {
      const result = await loadCatalog(source, next, {
        pageSize,
        signal: controller.signal,
      });
      if (mine !== token) return;
      // The first count a reader sees is not news.
      if (!hasLoaded) {
        announcer.cancel();
        announcer = createResultAnnouncer(result.total, announceDelay);
      }
      items = result.items;
      nextCursor = result.nextCursor;
      total = result.total;
      counts = result.counts ?? counts;
      hasLoaded = true;
      status = "idle";
      if (options.restore) await restore(options.restore);
      else {
        reserve = 0;
        await tick();
        measure();
      }
      watchEnd();
    } catch (error) {
      if (mine !== token || /** @type {Error} */ (error)?.name === "AbortError")
        return;
      status = "error";
      reserve = 0;
    }
  }

  /** @param {boolean} [byButton] */
  async function loadMore(byButton = false) {
    if (!nextCursor || status !== "idle") return;
    const mine = ++token;
    controller?.abort();
    controller = new AbortController();
    const before = items.length;
    status = "more";
    try {
      const result = await source.query({
        q: state.q,
        filters: state.filters,
        sort: state.sort,
        cursor: nextCursor,
        limit: pageSize,
        signal: controller.signal,
      });
      if (mine !== token) return;
      const known = new Set(items.map((item) => item.id));
      items = [...items, ...result.items.filter((item) => !known.has(item.id))];
      nextCursor = result.nextCursor;
      total = result.total;
      state = { ...state, pages: Math.ceil(items.length / pageSize) };
      status = "idle";
      if (syncUrl) writeUrl(false);
      if (byButton) await focusItem(before);
      watchEnd();
    } catch (error) {
      if (mine !== token || /** @type {Error} */ (error)?.name === "AbortError")
        return;
      status = "error";
    }
  }

  /** @param {number} index */
  async function focusItem(index) {
    if (useVirtual) {
      rows.scrollToIndex(Math.floor(index / columns), { align: "start" });
    }
    await tick();
    /** @type {HTMLElement | null | undefined} */
    const link = resultsEl?.querySelector(
      `[data-index="${index}"] .ccs-catalog-card__link`,
    );
    link?.focus({ preventScroll: false });
  }

  /** @param {boolean} push */
  function writeUrl(push) {
    const href =
      location.pathname +
      formatCatalogUrl(state, location.search) +
      location.hash;
    if (push) history.pushState(null, "", href);
    else history.replaceState(history.state, "", href);
  }

  /**
   * Make `patch` the state. The URL gets it first; a new query is a new
   * history entry, so Back undoes it.
   * @param {Partial<import("./catalog-url.js").CatalogState>} patch
   * @param {{ push?: boolean }} [options]
   */
  function navigate(patch, { push = true } = {}) {
    const next = { ...state, pages: 1, ...patch };
    const changed = !sameQuery(state, next);
    if (changed && syncUrl) saveNow();
    state = next;
    searchValue = next.q;
    if (syncUrl) writeUrl(push && changed);
    if (!changed) {
      // A change of view keeps the reader on the same card.
      if (patch.view) keepPlace();
      return;
    }
    if (toolbarEl) {
      const top = toolbarEl.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY > top) window.scrollTo(0, top);
    }
    load(next);
  }

  /** Hold the first card in view where it is across a change of layout. */
  async function keepPlace() {
    const { index, within } = anchorAt({
      scrollY: window.scrollY,
      listTop: listTop(),
      stride,
      columns,
    });
    await tick();
    measure();
    await tick();
    window.scrollTo(
      0,
      scrollForAnchor({ index, within, listTop: listTop(), stride, columns }),
    );
  }

  function onPopState() {
    const next = parseCatalogUrl(location.search);
    const snapshot = readSnapshot(queryKey(next));
    const same = sameQuery(state, next) && state.pages === next.pages;
    state = next;
    searchValue = next.q;
    if (same && hasLoaded) {
      if (snapshot) restore(snapshot);
      return;
    }
    if (snapshot) reserve = snapshot.y + window.innerHeight;
    load(next, { restore: snapshot });
  }

  /** @param {string} q */
  function commitQuery(q) {
    const text = (q ?? "").trim();
    if (text === state.q) return;
    // A search starts a history entry; refining it does not add one for each
    // pause in typing.
    navigate({ q: text }, { push: state.q === "" });
  }

  /** @type {IntersectionObserver | undefined} */
  let endObserver;

  /** Look again at the end of the list: it may already be in range. */
  function watchEnd() {
    if (!endObserver || !sentinelEl) return;
    endObserver.unobserve(sentinelEl);
    endObserver.observe(sentinelEl);
  }

  /** @param {CustomEvent<{ item: import("./catalog-data.js").CatalogItem; favorite: boolean }>} event */
  function toggleFavorite({ detail }) {
    favorites = new Set(favorites);
    if (detail.favorite) favorites.add(detail.item.id);
    else favorites.delete(detail.item.id);
  }

  /** @param {CustomEvent<{ item: import("./catalog-data.js").CatalogItem; compare: boolean }>} event */
  function toggleCompare({ detail }) {
    comparing = new Set(comparing);
    if (detail.compare) comparing.add(detail.item.id);
    else comparing.delete(detail.item.id);
  }

  /** @param {FocusEvent} event */
  function onFocusIn(event) {
    const row = /** @type {HTMLElement} */ (event.target)?.closest?.(
      "[data-row]",
    );
    focusedRow = row ? Number(row.getAttribute("data-row")) : -1;
  }

  /** @param {FocusEvent} event */
  function onFocusOut(event) {
    if (!resultsEl?.contains(/** @type {Node | null} */ (event.relatedTarget)))
      focusedRow = -1;
  }

  function clearAll() {
    navigate({ q: "", filters: {} });
  }

  onMount(() => {
    mounted = true;
    const previousRestoration = history.scrollRestoration;
    if (syncUrl) history.scrollRestoration = "manual";

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", saveNow);
    window.addEventListener("popstate", onPopState);
    const resize = new ResizeObserver(() => {
      measure();
      if (useVirtual) onScroll();
    });
    if (resultsEl) resize.observe(resultsEl);

    if (loadMode === "infinite") {
      endObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) loadMore();
        },
        { rootMargin: "0px 0px 600px 0px" },
      );
      if (sentinelEl) endObserver.observe(sentinelEl);
    }

    measure();
    const snapshot = syncUrl ? readSnapshot(queryKey(state)) : null;
    if (snapshot) {
      // Make the page tall enough to scroll to before the items are here.
      reserve = snapshot.y + window.innerHeight;
      tick().then(() => window.scrollTo(0, snapshot.y));
    }
    if (initial) {
      if (snapshot) restore(snapshot);
    } else {
      load(state, { restore: snapshot });
    }

    return () => {
      controller?.abort();
      saveSoon.cancel();
      announcer.cancel();
      resize.disconnect();
      endObserver?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", saveNow);
      window.removeEventListener("popstate", onPopState);
      if (syncUrl) history.scrollRestoration = previousRestoration;
    };
  });
</script>

<div class="ccs-catalog" style:--ccs-catalog-card-min="{CARD_MIN_REM}rem">
  <div class="ccs-catalog__header">
    <PageHeader
      grid
      title="Catalog"
      subtitle="Services, software and templates to build with"
    >
      <svelte:fragment slot="breadcrumb">
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="#home">Home</BreadcrumbItem>
          <BreadcrumbItem href="#catalog" isCurrentPage>Catalog</BreadcrumbItem>
        </Breadcrumb>
      </svelte:fragment>
    </PageHeader>
  </div>

  <div class="ccs-catalog__layout">
    <FilterFlyout
      bind:open={flyoutOpen}
      bind:flyout
      class="ccs-catalog__filters"
    >
      <FilterPanel
        {facets}
        value={state.filters}
        {counts}
        on:change={(event) => navigate({ filters: event.detail })}
      />
    </FilterFlyout>

    <main class="ccs-catalog__main" aria-label="Catalog results">
      <div class="ccs-catalog__toolbar" bind:this={toolbarEl}>
        <div class="ccs-catalog__search">
          <Search
            bind:value={searchValue}
            labelText="Search the catalog"
            placeholder="Search the catalog"
            shortcut="/"
            debounce={250}
            loading={status === "loading"}
            loadingDelay={300}
            on:search={(event) => commitQuery(event.detail)}
            on:clear={() => commitQuery("")}
          />
        </div>
        <div class="ccs-catalog__controls">
          {#if flyout}
            <Button
              kind="tertiary"
              icon={Filter}
              on:click={() => (flyoutOpen = true)}
            >
              Filters{filterCount > 0 ? ` (${filterCount})` : ""}
            </Button>
          {/if}
          <Dropdown
            type="inline"
            size="lg"
            labelText="Sort by"
            items={SORTS}
            selectedId={state.sort}
            on:select={(event) => {
              if (event.detail.selectedId !== state.sort)
                navigate({ sort: event.detail.selectedId });
            }}
          />
          <ToggleButtonGroup
            selectionMode="single"
            required
            size="lg"
            labelText="View"
            selected={[state.view]}
            on:change={(event) => {
              const next = event.detail[0] === "list" ? "list" : "grid";
              if (next !== state.view) navigate({ view: next });
            }}
          >
            <ToggleButton
              value="grid"
              icon={Grid}
              iconDescription="Grid view"
            />
            <ToggleButton
              value="list"
              icon={List}
              iconDescription="List view"
            />
          </ToggleButtonGroup>
        </div>
      </div>

      <div class="ccs-catalog__summary">
        {#if hasLoaded}
          <p class="ccs-catalog__count" aria-hidden="true">
            {resultsText(total)}{state.q ? " for \u201c" : ""}<bdi
              >{state.q}</bdi
            >{state.q ? "\u201d" : ""}
          </p>
        {/if}
        {#if filterCount > 0}
          <AppliedFilters
            {facets}
            value={state.filters}
            on:change={(event) => navigate({ filters: event.detail })}
          />
        {/if}
      </div>

      <div class="bx--visually-hidden ccs-catalog__status" role="status">
        {$announcer}
      </div>

      <div
        class="ccs-catalog__results"
        class:ccs-catalog__results--stale={status === "loading" && hasLoaded}
        class:ccs-catalog__results--list={view === "list"}
        aria-busy={status === "loading" || status === "more"}
        bind:this={resultsEl}
        style:min-block-size={reserve ? `${reserve}px` : undefined}
        style:--ccs-catalog-columns={columns}
        on:focusin={onFocusIn}
        on:focusout={onFocusOut}
      >
        {#if status === "error" && items.length === 0}
          <InlineNotification
            lowContrast
            hideCloseButton
            kind="error"
            title="The catalog could not be loaded."
            subtitle="Check your connection and try again."
          />
          <Button kind="tertiary" on:click={() => load(state)}>Try again</Button
          >
        {:else if !hasLoaded}
          <ul class="ccs-catalog__grid" aria-label="Loading results">
            {#each Array.from({ length: skeletonCount }, (_, at) => at) as at (at)}
              <li class="ccs-catalog__cell">
                <div class="ccs-catalog__skeleton">
                  <SkeletonText heading width="55%" />
                  <SkeletonText paragraph lines={3} />
                </div>
              </li>
            {/each}
          </ul>
        {:else if items.length === 0}
          <EmptyState subtitle="Try a different search, or remove a filter.">
            <!-- The query is the reader's text, in any direction: <bdi> keeps
                 it from reordering the quotes around it. -->
            <svelte:fragment slot="titleChildren">
              {#if state.q}No results for “<bdi>{state.q}</bdi>”{:else}No
                results{/if}
            </svelte:fragment>
            <Button kind="tertiary" on:click={clearAll}>
              {filterCount > 0 ? "Clear filters and search" : "Clear search"}
            </Button>
          </EmptyState>
        {:else if useVirtual}
          <div
            class="ccs-catalog__virtual"
            role="list"
            aria-label="Catalog items"
            style:block-size="{$rows.totalSize}px"
          >
            {#each windowRows as row (row)}
              <div
                class="ccs-catalog__row"
                role="presentation"
                data-row={row}
                style:transform="translateY({row * stride}px)"
                style:block-size="{stride - cardGap}px"
              >
                {#each items.slice(row * columns, row * columns + columns) as item, at (item.id)}
                  <div
                    class="ccs-catalog__cell"
                    role="listitem"
                    data-index={row * columns + at}
                    aria-posinset={row * columns + at + 1}
                    aria-setsize={total}
                  >
                    <CatalogCard
                      {item}
                      query={state.q}
                      href={itemHref(item)}
                      favorite={favorites.has(item.id)}
                      compare={comparing.has(item.id)}
                      on:favorite={toggleFavorite}
                      on:compare={toggleCompare}
                    />
                  </div>
                {/each}
              </div>
            {/each}
          </div>
        {:else}
          <ul class="ccs-catalog__grid" aria-label="Catalog items">
            {#each items as item, at (item.id)}
              <li
                class="ccs-catalog__cell"
                data-index={at}
                aria-posinset={at + 1}
                aria-setsize={total}
              >
                <CatalogCard
                  {item}
                  query={state.q}
                  href={itemHref(item)}
                  favorite={favorites.has(item.id)}
                  compare={comparing.has(item.id)}
                  on:favorite={toggleFavorite}
                  on:compare={toggleCompare}
                />
              </li>
            {/each}
          </ul>
        {/if}

        {#if status === "more"}
          <ul class="ccs-catalog__grid ccs-catalog__more" aria-hidden="true">
            {#each Array.from({ length: Math.min(columns, 3) }, (_, at) => at) as at (at)}
              <li class="ccs-catalog__cell">
                <div class="ccs-catalog__skeleton">
                  <SkeletonText heading width="55%" />
                  <SkeletonText paragraph lines={3} />
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <div class="ccs-catalog__end" bind:this={sentinelEl}>
        {#if hasLoaded && items.length > 0}
          <p class="ccs-catalog__progress">
            Showing {items.length.toLocaleString("en")} of {total.toLocaleString(
              "en",
            )}
          </p>
          {#if nextCursor}
            <Button
              kind="tertiary"
              disabled={status === "more"}
              on:click={() => loadMore(true)}
            >
              Load more
            </Button>
          {/if}
        {/if}
      </div>
    </main>
  </div>
</div>

<style>
  .ccs-catalog {
    min-block-size: 100vh;
  }

  .ccs-catalog__layout {
    display: grid;
    padding: var(--cds-spacing-05, 1rem);
    gap: var(--cds-spacing-05, 1rem);
    grid-template-columns: minmax(0, 1fr);
  }

  @media (min-width: 66rem) {
    .ccs-catalog__layout {
      grid-template-columns: 18rem minmax(0, 1fr);
    }

    .ccs-catalog__layout > :global(.ccs-catalog__filters) {
      position: sticky;
      align-self: start;
      overflow: auto;
      inset-block-start: var(--cds-spacing-05, 1rem);
      max-block-size: calc(100vh - 2rem);
    }
  }

  .ccs-catalog__toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--cds-spacing-05, 1rem);
  }

  .ccs-catalog__search {
    flex: 1 1 16rem;
    min-inline-size: 0;
  }

  .ccs-catalog__controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--cds-spacing-05, 1rem);
  }

  .ccs-catalog__summary {
    margin-block: var(--cds-spacing-05, 1rem);
  }

  .ccs-catalog__count {
    color: var(--cds-text-secondary);
    margin-block-end: var(--cds-spacing-03, 0.25rem);
  }

  .ccs-catalog__results {
    position: relative;
    transition: opacity 110ms;
  }

  /* The old results stay while the new ones load: dimmed, not replaced. */
  .ccs-catalog__results--stale {
    opacity: 0.6;
  }

  .ccs-catalog__grid {
    display: grid;
    margin: 0;
    gap: var(--cds-spacing-05, 1rem);
    grid-template-columns: repeat(
      auto-fill,
      minmax(min(100%, var(--ccs-catalog-card-min, 17rem)), 1fr)
    );
    list-style: none;
    padding-inline: 0;
  }

  .ccs-catalog__cell {
    min-inline-size: 0;
  }

  /* Cards share one height, so rows can be counted and positioned without
     measuring each one. */
  .ccs-catalog__grid > .ccs-catalog__cell,
  .ccs-catalog__row > .ccs-catalog__cell {
    block-size: 12rem;
  }

  .ccs-catalog__results--list .ccs-catalog__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .ccs-catalog__virtual {
    position: relative;
  }

  .ccs-catalog__row {
    position: absolute;
    display: grid;
    inset-block-start: 0;
    inset-inline: 0;
    gap: var(--cds-spacing-05, 1rem);
    grid-template-columns: repeat(
      var(--ccs-catalog-columns, 1),
      minmax(0, 1fr)
    );
  }

  .ccs-catalog__skeleton {
    block-size: 100%;
    background: var(--cds-layer);
    padding: var(--cds-spacing-05, 1rem);
  }

  .ccs-catalog__more {
    margin-block-start: var(--cds-spacing-05, 1rem);
  }

  .ccs-catalog__end {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-block: var(--cds-spacing-07, 2rem);
    gap: var(--cds-spacing-05, 1rem);
  }

  .ccs-catalog__progress {
    color: var(--cds-text-secondary);
  }

  /* A wide list row: the header and the body sit side by side. */
  @media (min-width: 42rem) {
    .ccs-catalog__results--list :global(.ccs-catalog-card) {
      display: grid;
      grid-template-columns: minmax(0, 20rem) minmax(0, 1fr);
    }

    .ccs-catalog__results--list .ccs-catalog__cell {
      block-size: 8rem;
    }
  }
</style>
