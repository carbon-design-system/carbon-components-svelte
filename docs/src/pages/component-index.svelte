<script lang="ts">
  import { goto, params, url } from "@roxi/routify";
  import {
    Box,
    Column,
    Content,
    Grid,
    Link,
    MultiSelect,
    Row,
    Search,
    Stack,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow,
    Tag,
    Text,
  } from "carbon-components-svelte";
  import ArrowDown from "carbon-icons-svelte/lib/ArrowDown.svelte";
  import ArrowsVertical from "carbon-icons-svelte/lib/ArrowsVertical.svelte";
  import ArrowUp from "carbon-icons-svelte/lib/ArrowUp.svelte";
  import Catalog from "carbon-icons-svelte/lib/Catalog.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import { onMount } from "svelte";
  import { COMPONENT_CATEGORIES } from "../component-categories";
  import {
    buildComponentIndex,
    CATEGORY_FILTER_PARAM,
    filterComponents,
    parseCategoryFilterParam,
    SEARCH_FILTER_PARAM,
    type SortDirection,
    type SortKey,
    serializeCategoryFilterParam,
    sortComponents,
    sourceRepoUrl,
  } from "../component-index";
  import { markdownBytesFor } from "../component-md-sizes";
  import CopyMarkdownButton from "../components/CopyMarkdownButton.svelte";
  import DocHero from "../components/DocHero.svelte";
  import { subscribeRoutifyGoto } from "../routify-nav";

  const entries = buildComponentIndex();

  const categoryItems = [
    { id: "select-all", text: "All categories", isSelectAll: true },
    ...COMPONENT_CATEGORIES.map((category) => ({
      id: category.label,
      text: category.label,
    })),
  ];

  let query = "";
  let categorySelectedIds: string[] = [];
  let urlSyncEnabled = false;
  let sortKey: SortKey = "name";
  let sortDirection: SortDirection = "asc";
  let searchRef: HTMLInputElement | null = null;

  const routifyNav = subscribeRoutifyGoto(goto);

  let lastUrlCategories = "";
  let lastUrlQuery = "";

  function normalizeCategories(raw: string): string {
    return serializeCategoryFilterParam(parseCategoryFilterParam(raw || null));
  }

  function applyUrlCategories(raw: string) {
    const labels = parseCategoryFilterParam(raw || null);
    const normalized = serializeCategoryFilterParam(labels);
    if (normalized === lastUrlCategories) return;
    lastUrlCategories = normalized;
    categorySelectedIds = labels;
  }

  function applyUrlQuery(raw: string) {
    const normalized = raw.trim();
    if (normalized === lastUrlQuery) return;
    lastUrlQuery = normalized;
    query = normalized;
  }

  $: applyUrlCategories($params[CATEGORY_FILTER_PARAM] ?? "");
  $: applyUrlQuery($params[SEARCH_FILTER_PARAM] ?? "");

  function syncFiltersToUrl(
    ids: string[],
    searchQuery: string,
    currentParams: Record<string, unknown>,
  ) {
    if (!urlSyncEnabled) return;
    const navigateTo = routifyNav.getNavigate();
    if (!navigateTo) return;

    const serializedCategories = serializeCategoryFilterParam(ids);
    const normalizedQuery = searchQuery.trim();
    const currentCategories = normalizeCategories(
      String(currentParams[CATEGORY_FILTER_PARAM] ?? ""),
    );
    const currentQuery = String(
      currentParams[SEARCH_FILTER_PARAM] ?? "",
    ).trim();
    if (
      serializedCategories === currentCategories &&
      normalizedQuery === currentQuery
    ) {
      return;
    }

    const nextParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(currentParams)) {
      if (typeof value === "string") nextParams[key] = value;
    }
    if (serializedCategories) {
      nextParams[CATEGORY_FILTER_PARAM] = serializedCategories;
    } else {
      delete nextParams[CATEGORY_FILTER_PARAM];
    }
    if (normalizedQuery) {
      nextParams[SEARCH_FILTER_PARAM] = normalizedQuery;
    } else {
      delete nextParams[SEARCH_FILTER_PARAM];
    }

    lastUrlCategories = serializedCategories;
    lastUrlQuery = normalizedQuery;
    navigateTo("$leaf", nextParams, { mode: "replace" });
  }

  onMount(() => {
    urlSyncEnabled = true;

    return routifyNav.unsubscribe;
  });

  function clearFilters() {
    query = "";
    categorySelectedIds = [];
    searchRef?.focus();
  }

  const columns: { key: SortKey; label: string }[] = [
    { key: "name", label: "Component" },
    { key: "category", label: "Category" },
    { key: "since", label: "Version" },
  ];

  const defaultDirection: Record<SortKey, SortDirection> = {
    name: "asc",
    category: "asc",
    since: "desc",
  };

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortDirection = defaultDirection[key];
    }
  }

  $: selectedCategories =
    categorySelectedIds.length === 0 ? null : new Set(categorySelectedIds);
  $: byCategory =
    selectedCategories === null
      ? entries
      : entries.filter((entry) => selectedCategories.has(entry.category));
  $: if (urlSyncEnabled) syncFiltersToUrl(categorySelectedIds, query, $params);
  $: visible = sortComponents(
    filterComponents(byCategory, query),
    sortKey,
    sortDirection,
  );
</script>

<svelte:head>
  <title>Component index · Carbon Components Svelte</title>
  <meta
    name="description"
    content="Searchable, sortable index of every Carbon Components Svelte component, with category and version metadata."
  >
</svelte:head>

<!-- Content supplies the SideNav offset; min-height fills the viewport so the
     shared footer stays pinned to the bottom (mirrors the 404 page). -->
<Content
  class="component-index-page"
  style="min-height: calc(100vh - 6rem - 1px);"
>
  <DocHero
    eyebrow="Reference"
    icon={Catalog}
    title="Component index"
    description="Every component in one flat, searchable list. The sidebar groups components by purpose; this index lets you sort by name, category, or release."
  />

  <Grid>
    <Row>
      <Column>
        <Stack orientation="horizontal" gap="1px" class="filter-bar">
          <MultiSelect
            size="lg"
            hideLabel
            label="Category"
            labelText="Category"
            placeholder="Filter categories..."
            selectionFeedback="top"
            bind:selectedIds={categorySelectedIds}
            items={categoryItems}
          />
          <Search
            size="xl"
            bind:value={query}
            bind:ref={searchRef}
            placeholder="Filter by name or category"
            spellcheck="false"
          />
        </Stack>
      </Column>
    </Row>

    <Row>
      <Column class="table-col">
        <div class="table-wrap">
          <div class="table-scroll">
            <StructuredList condensed flush class="component-list">
              <StructuredListHead>
                <StructuredListRow head>
                  {#each columns as column (column.key)}
                    <StructuredListCell
                      head
                      aria-sort={sortKey === column.key
                      ? sortDirection === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"}
                    >
                      <button
                        type="button"
                        class="sort-header"
                        class:is-active={sortKey === column.key}
                        on:click={() => toggleSort(column.key)}
                      >
                        <span class="sort-header__title">
                          {column.key === "name"
                          ? `Component (${visible.length})`
                          : column.label}
                          {#if sortKey === column.key}
                            <svelte:component
                              this={sortDirection === "asc" ? ArrowUp : ArrowDown}
                              size={16}
                            />
                          {:else}
                            <ArrowsVertical
                              size={16}
                              class="sort-header__idle-icon"
                            />
                          {/if}
                        </span>
                      </button>
                    </StructuredListCell>
                  {/each}
                  <StructuredListCell head class="links-cell" />
                </StructuredListRow>
              </StructuredListHead>
              <StructuredListBody>
                {#each visible as entry (entry.name)}
                  <StructuredListRow>
                    <StructuredListCell>
                      <Stack
                        orientation="horizontal"
                        gap={3}
                        align="flex-start"
                        wrap="wrap"
                        class="component-name-cell"
                      >
                        <Link href={$url(entry.href)}>
                          {entry.name}
                        </Link>
                        {#if entry.isNew}
                          <Tag size="sm" inline>New</Tag>
                        {/if}
                      </Stack>
                    </StructuredListCell>
                    <StructuredListCell>
                      <Text type="body-short-01" color="secondary"
                        >{entry.category}</Text
                      >
                    </StructuredListCell>
                    <StructuredListCell>
                      <Text type="body-short-01" color="secondary">
                        {entry.sinceVersion ?? "—"}
                      </Text>
                    </StructuredListCell>
                    <StructuredListCell class="links-cell">
                      <Stack
                        orientation="horizontal"
                        gap={6}
                        align="center"
                        justify="end"
                        class="doc-links"
                      >
                        <Link
                          href={sourceRepoUrl(entry.sourcePath)}
                          target="_blank"
                        >
                          Source code
                        </Link>
                        <Stack orientation="horizontal" gap={2} align="center">
                          <Link href={entry.markdownHref} target="_blank">
                            Markdown
                          </Link>
                          <CopyMarkdownButton
                            name={entry.name}
                            href={entry.markdownHref}
                            bytes={markdownBytesFor(entry.name)}
                            size="small"
                            tooltipPosition="right"
                            portalTooltip
                          />
                        </Stack>
                      </Stack>
                    </StructuredListCell>
                  </StructuredListRow>
                {/each}
              </StructuredListBody>
            </StructuredList>
          </div>

          {#if visible.length === 0}
            <Box paddingY={4}>
              <Stack gap={3}>
                <Text tag="p" type="productive-heading-03" color="primary">
                  No results
                </Text>
                <Text
                  type="body-long-01"
                  color="secondary"
                  balance
                  maxWidth="52ch"
                >
                  No components match your search or category filters. Try a
                  different query or broaden the category selection.
                </Text>
                <Link
                  href="#"
                  size="xl"
                  on:click={(e) => {
                    e.preventDefault();
                    clearFilters();
                  }}
                >
                  Clear filters
                </Link>
              </Stack>
            </Box>
          {/if}
        </div>
      </Column>
    </Row>
  </Grid>
</Content>

<style>
  :global(.filter-bar) {
    align-items: stretch;
  }

  :global(.filter-bar .bx--multi-select__wrapper) {
    flex: 0 0 220px;
    width: 220px;
    max-width: 220px;
  }

  :global(.filter-bar .bx--search) {
    flex: 1 1 auto;
  }

  @media (max-width: 672px) {
    :global(.filter-bar.bx--stack-horizontal) {
      flex-direction: column;
      gap: var(--cds-spacing-03);
    }

    :global(.filter-bar .bx--multi-select__wrapper) {
      flex: 1 1 auto;
      width: 100%;
      max-width: none;
    }

    :global(.filter-bar .bx--search) {
      width: 100%;
    }
  }

  .table-wrap {
    margin-top: var(--cds-spacing-07);
  }

  :global(.table-col) {
    min-width: 0;
  }

  .table-scroll {
    overflow-x: auto;
    max-width: 100%;
    padding: var(--cds-spacing-02);
    margin: calc(-1 * var(--cds-spacing-02));
  }

  .table-scroll :global(.component-list) {
    min-width: 52rem;
  }

  :global(.links-cell) {
    text-align: right;
  }

  .sort-header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--cds-text-02, #525252);
    font: inherit;
    text-align: left;
  }

  .sort-header__title {
    display: inline-flex;
    align-items: center;
    gap: var(--cds-spacing-03);
  }

  .sort-header:hover,
  .sort-header.is-active {
    color: var(--cds-text-01, #161616);
  }

  .sort-header:focus-visible {
    outline: 2px solid var(--cds-focus, #0f62fe);
    outline-offset: -2px;
  }

  .sort-header :global(.sort-header__idle-icon) {
    opacity: 0;
    transition: opacity 70ms;
  }

  .sort-header:hover :global(.sort-header__idle-icon) {
    opacity: 0.6;
  }

  :global(.component-name-cell) {
    min-width: 0;
  }

  @media (max-width: 672px) {
    :global(.component-name-cell.bx--stack-horizontal) {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  :global(.doc-links) {
    flex-wrap: wrap;
  }
</style>
