<script lang="ts">
  import {
    Box,
    Column,
    Content,
    CopyButton,
    Grid,
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
  import ColorTokenTable from "../components/ColorTokenTable.svelte";
  import DocHero from "../components/DocHero.svelte";
  import DocSection from "../components/DocSection.svelte";
  import DocSectionHeader from "../components/DocSectionHeader.svelte";
  import DocThemePicker from "../components/DocThemePicker.svelte";
  import TokenName from "../components/TokenName.svelte";
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
    { id: "color", label: "Color", count: countRows(colors) },
    { id: "component", label: "Component", count: countRows(components) },
    { id: "type", label: "Type", count: countRows(types) },
    {
      id: "spacing-and-size",
      label: "Spacing and size",
      count: countRows(scales),
    },
  ];
  $: total = sections.reduce((sum, section) => sum + section.count, 0);
</script>

<svelte:head>
  <title>Tokens · Carbon Components Svelte</title>
  <meta
    name="description"
    content="Every Carbon v11 token in Carbon Components Svelte, with live values in all five themes: colors, component colors, type styles, spacing and sizes."
  />
</svelte:head>

<Content class="tokens-page">
  <DocHero
    eyebrow="Reference"
    icon={ColorPalette}
    title="Tokens"
    description="Every token, with its value in all five themes. Copy a CSS variable, a Sass variable or a value."
  />

  <Grid>
    <Row>
      <Column>
        <Stack gap={6}>
          <Search
            size="lg"
            bind:value={query}
            labelText="Search tokens"
            placeholder="Search by name or value, such as layer-01 or #0f62fe"
            spellcheck="false"
          />
          <DocThemePicker legendText="Current theme" orientation="horizontal" />
          <Stack orientation="horizontal" gap={6} wrap="wrap">
            {#each sections as section (section.id)}
              {#if section.count > 0}
                <Link href="#{section.id}">
                  {section.label}
                  ({section.count})
                </Link>
              {/if}
            {/each}
          </Stack>
        </Stack>
      </Column>
    </Row>
  </Grid>

  {#if total === 0}
    <Grid>
      <Row>
        <Column>
          <Box paddingY={9}>
            <Stack gap={3}>
              <Text tag="p" type="heading-03" color="primary">No results</Text>
              <Text type="body-01" color="secondary" maxWidth="52ch">
                No token name or value matches "{query}". Try a shorter query,
                such as layer or #0f62fe.
              </Text>
            </Stack>
          </Box>
        </Column>
      </Row>
    </Grid>
  {/if}

  {#if colors.length}
    <DocSection>
      <Grid>
        <Box id="color">
          <DocSectionHeader
            eyebrow="Color"
            title="Color tokens"
            description="Theme colors, grouped by role. Translucent values show on each theme's background. The column for the current docs theme is highlighted."
            wide
          />
        </Box>
        {#each colors as group (group.id)}
          <Row>
            <Column>
              <Box marginBottom={9}>
                <Stack gap={5}>
                  <Stack gap={3}>
                    <Stack orientation="horizontal" gap={3} align="center">
                      <Text tag="h3" type="heading-03" color="primary">
                        {group.label}
                      </Text>
                      <Tag size="sm" type="gray">{group.rows.length}</Tag>
                    </Stack>
                    <Text type="body-01" color="secondary" maxWidth="64ch">
                      {group.description}
                    </Text>
                  </Stack>
                  <LazyMount
                    estimatedHeight={(group.rows.length + 1) * COLOR_ROW_HEIGHT}
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
      </Grid>
    </DocSection>
  {/if}

  {#if components.length}
    <DocSection>
      <Grid>
        <Box id="component">
          <DocSectionHeader
            eyebrow="Component"
            title="Component tokens"
            description="Colors that only one component uses, grouped by component."
            wide
          />
        </Box>
        {#each components as group (group.id)}
          <Row>
            <Column>
              <Box marginBottom={9}>
                <Stack gap={5}>
                  <Stack gap={3}>
                    <Stack orientation="horizontal" gap={3} align="center">
                      <Text tag="h3" type="heading-03" color="primary">
                        {group.label}
                      </Text>
                      <Tag size="sm" type="gray">{group.rows.length}</Tag>
                    </Stack>
                    <Text type="body-01" color="secondary" maxWidth="64ch">
                      {group.description}
                    </Text>
                  </Stack>
                  <LazyMount
                    estimatedHeight={(group.rows.length + 1) * COLOR_ROW_HEIGHT}
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
      </Grid>
    </DocSection>
  {/if}

  {#if types.length}
    <DocSection>
      <Grid>
        <Box id="type">
          <DocSectionHeader
            eyebrow="Type"
            title="Type tokens"
            description="Each type style, with its font size, line height, weight and letter spacing. Set one with the Text component's type prop."
            wide
          />
        </Box>
        {#each types as group (group.id)}
          <Row>
            <Column>
              <Box marginBottom={9}>
                <Stack gap={5}>
                  <Stack gap={3}>
                    <Stack orientation="horizontal" gap={3} align="center">
                      <Text tag="h3" type="heading-03" color="primary">
                        {group.label}
                      </Text>
                      <Tag size="sm" type="gray">{group.rows.length}</Tag>
                    </Stack>
                    <Text type="body-01" color="secondary" maxWidth="64ch">
                      {group.description}
                    </Text>
                  </Stack>
                  <Box overflowX="auto">
                    <Box minWidth="56rem">
                      <StructuredList
                        condensed
                        flush
                        aria-label="{group.label} type tokens"
                      >
                        <StructuredListHead>
                          <StructuredListRow head>
                            <StructuredListCell head>Token</StructuredListCell>
                            <StructuredListCell head
                              >Specimen</StructuredListCell
                            >
                            <StructuredListCell head
                              >Font size</StructuredListCell
                            >
                            <StructuredListCell head
                              >Line height</StructuredListCell
                            >
                            <StructuredListCell head>Weight</StructuredListCell>
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
                                <TokenName name={row.name} copyable={false} />
                              </StructuredListCell>
                              <StructuredListCell>
                                <Text type={row.name} color="primary">
                                  {SPECIMEN}
                                </Text>
                              </StructuredListCell>
                              <StructuredListCell>
                                <Text
                                  tag="code"
                                  type="code-01"
                                  color="secondary"
                                  wrap="nowrap"
                                >
                                  {withPx(row.style["font-size"])}
                                </Text>
                              </StructuredListCell>
                              <StructuredListCell>
                                <Text
                                  tag="code"
                                  type="code-01"
                                  color="secondary"
                                  wrap="nowrap"
                                >
                                  {row.style["line-height"]}
                                </Text>
                              </StructuredListCell>
                              <StructuredListCell>
                                <Text
                                  tag="code"
                                  type="code-01"
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
                                  tag="code"
                                  type="code-01"
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
      </Grid>
    </DocSection>
  {/if}

  {#if scales.length}
    <DocSection>
      <Grid>
        <Box id="spacing-and-size">
          <DocSectionHeader
            eyebrow="Spacing and size"
            title="Spacing, layout, container and size tokens"
            description="Each bar is drawn at the token's size. Pixel values assume a 16px root font size."
            wide
          />
        </Box>
        {#each scales as group (group.id)}
          <Row>
            <Column>
              <Box marginBottom={9}>
                <Stack gap={5}>
                  <Stack gap={3}>
                    <Stack orientation="horizontal" gap={3} align="center">
                      <Text tag="h3" type="heading-03" color="primary">
                        {group.label}
                      </Text>
                      <Tag size="sm" type="gray">{group.rows.length}</Tag>
                    </Stack>
                    <Text type="body-01" color="secondary" maxWidth="64ch">
                      {group.description}
                    </Text>
                  </Stack>
                  <Box overflowX="auto">
                    <Box minWidth="40rem">
                      <StructuredList
                        condensed
                        flush
                        class="token-table"
                        aria-label="{group.label} tokens"
                      >
                        <StructuredListHead>
                          <StructuredListRow head>
                            <StructuredListCell head class="token-name-column"
                              >Token</StructuredListCell
                            >
                            <StructuredListCell head class="token-metric-column"
                              >Value</StructuredListCell
                            >
                            <StructuredListCell head>Scale</StructuredListCell>
                          </StructuredListRow>
                        </StructuredListHead>
                        <StructuredListBody>
                          {#each group.rows as row (row.name)}
                            <StructuredListRow>
                              <StructuredListCell>
                                <TokenName name={row.name} />
                              </StructuredListCell>
                              <StructuredListCell>
                                <Stack
                                  orientation="horizontal"
                                  gap={1}
                                  align="center"
                                >
                                  <Text
                                    tag="code"
                                    type="code-01"
                                    color="secondary"
                                  >
                                    {withPx(row.value)}
                                  </Text>
                                  <CopyButton
                                    kind="ghost"
                                    size="sm"
                                    text={row.value}
                                    iconDescription="Copy value"
                                  />
                                </Stack>
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
      </Grid>
    </DocSection>
  {/if}
</Content>

<style>
  /* Equal theme columns, so swatches line up from table to table. */
  :global(.token-table) {
    table-layout: fixed;
  }

  :global(.token-name-column) {
    width: 16rem;
  }

  :global(.token-current) {
    background-color: var(--cds-layer-01);
  }

  :global(.token-metric-column) {
    width: 10rem;
  }

  @media (forced-colors: active) {
    :global(.token-current) {
      outline: 1px solid Highlight;
      outline-offset: -1px;
    }

    :global(.token-bar) {
      forced-color-adjust: none;
      background-color: CanvasText;
    }
  }
</style>
