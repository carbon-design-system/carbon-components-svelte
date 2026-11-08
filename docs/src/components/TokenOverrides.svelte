<script lang="ts">
  import {
    Accordion,
    AccordionItem,
    Button,
    Search,
    Stack,
    Text,
    TextInput,
  } from "carbon-components-svelte";
  import type {
    CarbonTheme,
    CarbonToken,
  } from "carbon-components-svelte/src/Theme/Theme.svelte";
  import Reset from "carbon-icons-svelte/lib/Reset.svelte";
  import { editableGroups, type EditableRow } from "../theme-builder";
  import { filterGroups, normalizeQuery } from "../token-reference";

  type Tokens = Partial<Record<CarbonToken, string>>;

  /** The base theme, for the values no override or brand token sets. */
  export let theme: CarbonTheme;

  /** The tokens `createTheme` returned, overrides included. */
  export let derived: Tokens;

  /** Token overrides, keyed by token name. */
  export let overrides: Tokens = {};

  const groups = editableGroups.map((group) => ({ ...group, description: "" }));

  let query = "";

  // Text typed into a row that isn't a color yet. It stays in the field and
  // stays out of the theme, so the preview doesn't flash while you type.
  let drafts: Record<string, string> = {};

  $: normalized = normalizeQuery(query);
  $: visible = filterGroups(groups, normalized, (row) => [
    current(derived, row),
  ]);
  $: count = Object.keys(overrides).length;

  function current(tokens: Tokens, row: EditableRow) {
    const base = typeof row.base === "string" ? row.base : row.base[theme];
    return tokens[row.name as CarbonToken] ?? base;
  }

  function set({ name, property }: EditableRow, value: string) {
    const trimmed = value.trim();
    const { [name]: _, ...rest } = drafts;
    drafts = rest;
    if (trimmed && !CSS.supports(property, trimmed)) {
      drafts = { ...rest, [name]: value };
      return;
    }
    const next = { ...overrides };
    if (trimmed) next[name as CarbonToken] = trimmed;
    else delete next[name as CarbonToken];
    overrides = next;
  }

  function reset() {
    overrides = {};
    drafts = {};
  }

  // A native color input only takes #rrggbb, so expand #rgb and read the
  // channels of rgb() and rgba(). Alpha drops.
  function toHex6(value: string) {
    const short = value.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
    if (short)
      return `#${short
        .slice(1)
        .map((c) => c + c)
        .join("")}`;
    if (/^#[0-9a-f]{6}$/i.test(value)) return value;
    const rgb = value.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
    if (!rgb) return "#000000";
    return `#${rgb
      .slice(1, 4)
      .map((n) => Number(n).toString(16).padStart(2, "0"))
      .join("")}`;
  }

  function overriddenIn(rows: { name: string }[]) {
    return rows.filter((row) => row.name in overrides).length;
  }
</script>

<Stack gap={5}>
  <Stack orientation="horizontal" justify="space-between" align="center">
    <Text tag="h2" type="heading-compact-01" color="primary">
      Customize tokens
    </Text>
    <Button
      kind="ghost"
      size="sm"
      icon={Reset}
      disabled={count === 0}
      on:click={reset}
    >
      Reset {count > 0 ? `(${count})` : ""}
    </Button>
  </Stack>

  <Search
    size="sm"
    labelText="Filter tokens"
    placeholder="Filter, such as layer or tab"
    spellcheck="false"
    bind:value={query}
  />

  {#if visible.length === 0}
    <Text type="helper-text-01" color="secondary">
      No token matches “{query}”.
    </Text>
  {:else}
    <div class="token-overrides-accordion">
      <Accordion size="sm">
        {#each visible as group (group.id)}
          {@const changed = overriddenIn(group.rows)}
          <AccordionItem lazy open={normalized !== ""}>
            <svelte:fragment slot="title">
              {group.label}
              {#if changed > 0}
                <Text tag="span" type="label-01" color="secondary">
                  · {changed} changed
                </Text>
              {/if}
            </svelte:fragment>
            <ul class="token-overrides">
              {#each group.rows as row (row.name)}
                {@const value = current(derived, row)}
                <li class="token-override">
                  {#if row.property === "color"}
                    <label
                      class="token-override-swatch"
                      style="background: {value}"
                      title="Pick a color for {row.name}"
                    >
                      <input
                        class="bx--visually-hidden"
                        type="color"
                        aria-label="Pick a color for {row.name}"
                        value={toHex6(value)}
                        on:input={(e) => set(row, e.currentTarget.value)}
                      />
                    </label>
                  {:else}
                    <span></span>
                  {/if}
                  <Text
                    tag="span"
                    type="label-01"
                    color="primary"
                    wrap="break-word"
                  >
                    {row.name}
                  </Text>
                  <TextInput
                    size="sm"
                    hideLabel
                    labelText={row.name}
                    placeholder={value}
                    spellcheck="false"
                    invalid={row.name in drafts}
                    value={drafts[row.name] ??
                      overrides[row.name as CarbonToken] ??
                      ""}
                    on:input={(e) => set(row, String(e.detail ?? ""))}
                  />
                </li>
              {/each}
            </ul>
          </AccordionItem>
        {/each}
      </Accordion>
    </div>
  {/if}
</Stack>

<style>
  /* Carbon keeps a quarter of the panel empty for reading width. These
     rows need the room. */
  .token-overrides-accordion :global(.bx--accordion__content) {
    padding-inline-end: var(--cds-spacing-05);
  }

  .token-overrides {
    display: grid;
    gap: var(--cds-spacing-03);
  }

  .token-override {
    display: grid;
    grid-template-columns: 1.5rem minmax(0, 1fr) 7.5rem;
    gap: var(--cds-spacing-03);
    align-items: center;
  }

  .token-override-swatch {
    width: 1.5rem;
    height: 1.5rem;
    border: 1px solid var(--cds-border-subtle);
    cursor: pointer;
  }

  .token-override-swatch:focus-within {
    outline: 2px solid var(--cds-focus);
    outline-offset: 1px;
  }
</style>
