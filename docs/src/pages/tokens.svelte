<script lang="ts">
  import {
    Box,
    Button,
    Column,
    Content,
    CopyText,
    EmptyState,
    LazyMount,
    Link,
    Row,
    Search,
    SkeletonText,
    Stack,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow,
    Tag,
    Text,
  } from "carbon-components-svelte";
  import ColorPalette from "carbon-icons-svelte/lib/ColorPalette.svelte";
  import Binocular from "carbon-pictograms-svelte/lib/Binocular.svelte";
  import ColorTokenTable from "../components/ColorTokenTable.svelte";
  import ComponentDocLayout from "../components/ComponentDocLayout.svelte";
  import DocHero from "../components/DocHero.svelte";
  import DocSection from "../components/DocSection.svelte";
  import DocSectionHeader from "../components/DocSectionHeader.svelte";
  import DocThemePicker from "../components/DocThemePicker.svelte";
  import TokenName from "../components/TokenName.svelte";
  import TokenTocNav from "../components/TokenTocNav.svelte";
  import { theme } from "../store";
  import {
    colorGroups,
    type ColorRow,
    componentGroups,
    filterGroups,
    normalizeQuery,
    remToPx,
    scaleGroups,
    type ScaleRow,
    typeGroups,
    type TypeRow,
  } from "../token-reference";

  // A row of a color table: the name cell plus five swatch cells.
  const COLOR_ROW_HEIGHT = 112;

  const WEIGHT_NAMES: Record<string, string> = {
    "300": "Light",
    "400": "Regular",
    "600": "Semibold",
  };

  const SPECIMEN = "Deploy the billing service to us-south";

  let query = "";

  function colorValues(row: ColorRow) {
    return Object.values(row.values);
  }

  function typeValues(row: TypeRow) {
    return Object.values(row.style);
  }

  function scaleValues(row: ScaleRow) {
    return [row.value];
  }

  function withPx(value: string | undefined) {
    if (value === undefined) return "—";
    const px = remToPx(value);
    return px ? `${value} (${px})` : value;
  }

  function countRows(groups: { rows: unknown[] }[]) {
    return groups.reduce((total, group) => total + group.rows.length, 0);
  }

  $: currentTheme = $theme;
  $: normalized = normalizeQuery(query);
  $: colors = filterGroups(colorGroups, normalized, colorValues);
  $: components = filterGroups(componentGroups, normalized, colorValues);
  $: types = filterGroups(typeGroups, normalized, typeValues);
  $: scales = filterGroups(scaleGroups, normalized, scaleValues);
  $: sections = [
    { id: "color", label: "Color", groups: colors },
    { id: "component", label: "Component", groups: components },
    { id: "type", label: "Type", groups: types },
    { id: "spacing-and-size", label: "Spacing and size", groups: scales },
  ];
  $: total = sections.reduce(
    (sum, section) => sum + countRows(section.groups),
    0,
  );
</script>

<svelte:head>
  <title>Tokens · Carbon Components Svelte</title>
  <meta
    name="description"
    content="Carbon tokens and their values in each theme: color, type, spacing and size."
  />
</svelte:head>

<Content class="tokens-page">
  <DocHero eyebrow="Reference" icon={ColorPalette} title="Tokens" />

  <div class="tokens-layout">
    <ComponentDocLayout>
      <Stack gap={6}>
        <Text type="body-02" color="primary" maxWidth="68ch">
          Tokens are the named values that style each component: colors, type
          styles, spacing and sizes. Each theme gives a token its own value, so
          one token works on White and on Gray 100. Use tokens in place of fixed
          values, and your styles follow the theme.
        </Text>
        <Search
          size="lg"
          bind:value={query}
          labelText="Search tokens"
          placeholder="Search by name or value, such as layer-01 or #0f62fe"
          spellcheck="false"
        />
      </Stack>

      <svelte:fragment slot="rows">
        <Row class="tokens-toc-mobile">
          <Column>
            <Stack gap={6}>
              <DocThemePicker
                legendText="Current theme"
                orientation="horizontal"
              />
              <TokenTocNav {sections} sectionsOnly />
            </Stack>
          </Column>
        </Row>
        <div role="status">
          {#if total === 0}
            <Row>
              <Column>
                <EmptyState
                  headingLevel={2}
                  titleText="No results"
                  subtitleText="No token name or value matches “{query}”. Try a shorter query, such as layer or #0f62fe."
                >
                  <Binocular slot="illustration" />
                  <Button kind="tertiary" on:click={() => (query = "")}>
                    Clear search
                  </Button>
                </EmptyState>
              </Column>
            </Row>
          {/if}
        </div>

        {#if colors.length}
          <DocSection>
            <Box id="color" class="token-anchor">
              <DocSectionHeader title="Color tokens" wide />
            </Box>
            {#each colors as group (group.id)}
              <Row>
                <Column>
                  <Box marginBottom={9}>
                    <Stack gap={5}>
                      <Stack orientation="horizontal" gap={3} align="center">
                        <Text
                          tag="h3"
                          id={group.id}
                          class="token-anchor"
                          type="heading-03"
                          color="primary"
                        >
                          {group.label}
                        </Text>
                        <Tag size="xs" type="gray">{group.rows.length}</Tag>
                      </Stack>
                      <LazyMount
                        estimatedHeight={(group.rows.length + 1) *
                          COLOR_ROW_HEIGHT}
                      >
                        <SkeletonText slot="placeholder" paragraph lines={4} />
                        <ColorTokenTable
                          label={group.label}
                          rows={group.rows}
                          {currentTheme}
                        />
                      </LazyMount>
                    </Stack>
                  </Box>
                </Column>
              </Row>
            {/each}
          </DocSection>
        {/if}

        {#if components.length}
          <DocSection>
            <Box id="component" class="token-anchor">
              <DocSectionHeader title="Component tokens" wide />
            </Box>
            {#each components as group (group.id)}
              <Row>
                <Column>
                  <Box marginBottom={9}>
                    <Stack gap={5}>
                      <Stack orientation="horizontal" gap={3} align="center">
                        <Text
                          tag="h3"
                          id={group.id}
                          class="token-anchor"
                          type="heading-03"
                          color="primary"
                        >
                          {group.label}
                        </Text>
                        <Tag size="xs" type="gray">{group.rows.length}</Tag>
                      </Stack>
                      <LazyMount
                        estimatedHeight={(group.rows.length + 1) *
                          COLOR_ROW_HEIGHT}
                      >
                        <SkeletonText slot="placeholder" paragraph lines={4} />
                        <ColorTokenTable
                          label={group.label}
                          rows={group.rows}
                          {currentTheme}
                        />
                      </LazyMount>
                    </Stack>
                  </Box>
                </Column>
              </Row>
            {/each}
          </DocSection>
        {/if}

        {#if types.length}
          <DocSection>
            <Box id="type" class="token-anchor">
              <DocSectionHeader title="Type tokens" wide>
                <Text type="body-01" color="secondary">
                  To change the font family, set the font variables. See
                  <Link inline href="/fonts">Fonts</Link>.
                </Text>
              </DocSectionHeader>
            </Box>
            {#each types as group (group.id)}
              <Row>
                <Column>
                  <Box marginBottom={9}>
                    <Stack gap={5}>
                      <Stack orientation="horizontal" gap={3} align="center">
                        <Text
                          tag="h3"
                          id={group.id}
                          class="token-anchor"
                          type="heading-03"
                          color="primary"
                        >
                          {group.label}
                        </Text>
                        <Tag size="xs" type="gray">{group.rows.length}</Tag>
                      </Stack>
                      <Box overflowX="auto" class="token-scroll">
                        <Box minWidth="48rem">
                          <StructuredList
                            condensed
                            flush
                            aria-label="{group.label} type tokens"
                          >
                            <StructuredListHead>
                              <StructuredListRow head>
                                <StructuredListCell head
                                  >Token</StructuredListCell
                                >
                                <StructuredListCell head
                                  >Specimen</StructuredListCell
                                >
                                <StructuredListCell head
                                  >Font size</StructuredListCell
                                >
                                <StructuredListCell head
                                  >Line height</StructuredListCell
                                >
                                <StructuredListCell head
                                  >Weight</StructuredListCell
                                >
                                <StructuredListCell head
                                  >Letter spacing</StructuredListCell
                                >
                              </StructuredListRow>
                            </StructuredListHead>
                            <StructuredListBody>
                              {#each group.rows as row (row.name)}
                                {@const weight = row.style["font-weight"]}
                                <StructuredListRow>
                                  <StructuredListCell>
                                    <TokenName
                                      name={row.name}
                                      copyable={false}
                                    />
                                  </StructuredListCell>
                                  <StructuredListCell>
                                    <Text type={row.name} color="primary">
                                      {SPECIMEN}
                                    </Text>
                                  </StructuredListCell>
                                  <StructuredListCell>
                                    <Text
                                      tag="span"
                                      type="label-01"
                                      color="secondary"
                                      wrap="nowrap"
                                    >
                                      {withPx(row.style["font-size"])}
                                    </Text>
                                  </StructuredListCell>
                                  <StructuredListCell>
                                    <Text
                                      tag="span"
                                      type="label-01"
                                      color="secondary"
                                      wrap="nowrap"
                                    >
                                      {row.style["line-height"]}
                                    </Text>
                                  </StructuredListCell>
                                  <StructuredListCell>
                                    <Text
                                      tag="span"
                                      type="label-01"
                                      color="secondary"
                                      wrap="nowrap"
                                    >
                                      {weight
                                        ? `${weight} ${WEIGHT_NAMES[weight] ?? ""}`
                                        : "—"}
                                    </Text>
                                  </StructuredListCell>
                                  <StructuredListCell>
                                    <Text
                                      tag="span"
                                      type="label-01"
                                      color="secondary"
                                      wrap="nowrap"
                                    >
                                      {row.style["letter-spacing"]}
                                    </Text>
                                  </StructuredListCell>
                                </StructuredListRow>
                              {/each}
                            </StructuredListBody>
                          </StructuredList>
                        </Box>
                      </Box>
                    </Stack>
                  </Box>
                </Column>
              </Row>
            {/each}
          </DocSection>
        {/if}

        {#if scales.length}
          <DocSection>
            <Box id="spacing-and-size" class="token-anchor">
              <DocSectionHeader
                title="Spacing, layout, container and size tokens"
                wide
              />
            </Box>
            {#each scales as group (group.id)}
              <Row>
                <Column>
                  <Box marginBottom={9}>
                    <Stack gap={5}>
                      <Stack orientation="horizontal" gap={3} align="center">
                        <Text
                          tag="h3"
                          id={group.id}
                          class="token-anchor"
                          type="heading-03"
                          color="primary"
                        >
                          {group.label}
                        </Text>
                        <Tag size="xs" type="gray">{group.rows.length}</Tag>
                      </Stack>
                      <Box overflowX="auto" class="token-scroll">
                        <Box minWidth="40rem">
                          <StructuredList
                            condensed
                            flush
                            class="token-table"
                            aria-label="{group.label} tokens"
                          >
                            <StructuredListHead>
                              <StructuredListRow head>
                                <StructuredListCell
                                  head
                                  class="token-name-column"
                                  >Token</StructuredListCell
                                >
                                <StructuredListCell
                                  head
                                  class="token-metric-column"
                                  >Value</StructuredListCell
                                >
                                <StructuredListCell head
                                  >Scale</StructuredListCell
                                >
                              </StructuredListRow>
                            </StructuredListHead>
                            <StructuredListBody>
                              {#each group.rows as row (row.name)}
                                <StructuredListRow>
                                  <StructuredListCell>
                                    <TokenName name={row.name} />
                                  </StructuredListCell>
                                  <StructuredListCell>
                                    <CopyText
                                      text={row.value}
                                      iconDescription="Copy value"
                                    >
                                      <Text
                                        tag="span"
                                        type="label-01"
                                        color="secondary"
                                      >
                                        {withPx(row.value)}
                                      </Text>
                                    </CopyText>
                                  </StructuredListCell>
                                  <StructuredListCell>
                                    <Box
                                      width={row.value}
                                      height={5}
                                      fill="brand"
                                      class="token-bar"
                                      aria-hidden="true"
                                    />
                                  </StructuredListCell>
                                </StructuredListRow>
                              {/each}
                            </StructuredListBody>
                          </StructuredList>
                        </Box>
                      </Box>
                    </Stack>
                  </Box>
                </Column>
              </Row>
            {/each}
          </DocSection>
        {/if}
      </svelte:fragment>

      <svelte:fragment slot="aside">
        <Stack gap={7}>
          <DocThemePicker legendText="Current theme" />
          <TokenTocNav {sections} />
        </Stack>
      </svelte:fragment>
    </ComponentDocLayout>
  </div>
</Content>

<style>
  /* Land a section below the sticky header, with room to spare. */
  :global(.token-anchor) {
    scroll-margin-top: calc(3rem + var(--cds-spacing-05));
  }

  /*
   * From 66rem the tables fit their column, so they drop the scroll box and
   * the head row sticks under the site header while the rows scroll. A
   * scroll box would hold the sticky head inside itself.
   */
  @media (min-width: 66rem) {
    :global(.token-scroll.bx--box-overflow-x-auto) {
      overflow: visible;
    }

    :global(.token-scroll .bx--structured-list-thead .bx--structured-list-th) {
      position: sticky;
      z-index: 1;
      top: 3rem;
      background-color: var(--cds-background);
    }
  }

  /* The hero sits above, so the aside starts level with the content. */
  :global(.tokens-layout .component-body .table) {
    margin-top: 0;
  }

  :global(.tokens-toc-mobile) {
    display: none;
  }

  @media (max-width: 65.98rem) {
    :global(.tokens-toc-mobile) {
      display: flex;
      padding-top: var(--cds-spacing-07);
    }
  }

  /* Equal theme columns, so swatches line up from table to table. */
  :global(.token-table) {
    table-layout: fixed;
  }

  :global(.token-name-column) {
    width: 18rem;
  }

  :global(.token-metric-column) {
    width: 10rem;
  }

  @media (forced-colors: active) {
    :global(.token-bar) {
      forced-color-adjust: none;
      background-color: CanvasText;
    }
  }
</style>
