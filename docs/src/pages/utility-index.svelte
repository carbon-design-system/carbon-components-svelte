<script lang="ts">
  import { url } from "@roxi/routify";
  import {
    Box,
    Column,
    Content,
    Grid,
    Link,
    Row,
    Search,
    Stack,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow,
    Text,
  } from "carbon-components-svelte";
  import Code from "carbon-icons-svelte/lib/Code.svelte";
  import DocHero from "../components/DocHero.svelte";
  import InlineSnippet from "../components/InlineSnippet.svelte";
  import {
    buildUtilityIndex,
    filterUtilities,
    utilitySourceRepoUrl,
  } from "../utility-index";

  const entries = buildUtilityIndex();

  let query = "";
  let searchRef: HTMLInputElement | null = null;

  $: visible = filterUtilities(entries, query);

  function clearFilters() {
    query = "";
    searchRef?.focus();
  }
</script>

<svelte:head>
  <title>Utility index · Carbon Components Svelte</title>
  <meta
    name="description"
    content="Searchable index of utility functions exported by Carbon Components Svelte, with signatures and source links."
  >
</svelte:head>

<!-- Content supplies the SideNav offset; min-height fills the viewport so the
     shared footer stays pinned to the bottom (mirrors the component index). -->
<Content
  class="utility-index-page"
  style="min-height: calc(100vh - 6rem - 1px);"
>
  <DocHero eyebrow="Reference" icon={Code} title="Utility index" />

  <Grid>
    <Row>
      <Column>
        <Search
          size="xl"
          bind:value={query}
          bind:ref={searchRef}
          placeholder="Filter by name or description"
          spellcheck="false"
        />
      </Column>
    </Row>

    <Row>
      <Column class="table-col">
        <div class="table-wrap">
          <div class="table-scroll">
            <StructuredList condensed class="utility-list">
              <StructuredListHead>
                <StructuredListRow head>
                  <StructuredListCell head>
                    Utility ({visible.length})
                  </StructuredListCell>
                  <StructuredListCell head>Signature</StructuredListCell>
                  <StructuredListCell head>Description</StructuredListCell>
                  <StructuredListCell head class="links-cell" />
                </StructuredListRow>
              </StructuredListHead>
              <StructuredListBody>
                {#each visible as entry (entry.name)}
                  <StructuredListRow>
                    <StructuredListCell>
                      <InlineSnippet code={entry.name} portalTooltip />
                    </StructuredListCell>
                    <StructuredListCell>
                      {#if entry.signature}
                        <code class="signature">
                          {entry.name}{entry.signature}
                        </code>
                      {:else}
                        <Text type="body-short-01" color="secondary">—</Text>
                      {/if}
                    </StructuredListCell>
                    <StructuredListCell>
                      <Text type="body-short-01" color="secondary">
                        {entry.description ?? "—"}
                      </Text>
                    </StructuredListCell>
                    <StructuredListCell class="links-cell">
                      {#if entry.sourcePath}
                        <Link
                          href={utilitySourceRepoUrl(entry.sourcePath)}
                          target="_blank"
                        >
                          Source code
                        </Link>
                      {/if}
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
                  No utilities match your search. Try a different query.
                </Text>
                <Link
                  href="#"
                  size="xl"
                  on:click={(e) => {
                    e.preventDefault();
                    clearFilters();
                  }}
                >
                  Clear filter
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

  .table-scroll :global(.utility-list) {
    min-width: 52rem;
  }

  :global(.links-cell) {
    text-align: right;
    white-space: nowrap;
  }

  .signature {
    word-break: break-word;
    font-size: var(--cds-code-01-font-size, 0.75rem);
  }
</style>
