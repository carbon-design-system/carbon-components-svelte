<script context="module">
  /**
   * The options to draw. A search keeps the labels that contain it. A
   * collapsed list keeps its first `limit` options and any checked one
   * beyond them, so a selection never hides. `hide` drops an option with no
   * results unless it is checked.
   *
   * @param {ReadonlyArray<{ id: string | number, label?: string }>} options
   * @param {string} query
   * @param {boolean} expanded
   * @param {number} limit
   * @param {Record<string, number> | undefined} counts
   * @param {"disable" | "hide"} zeroCounts
   * @param {Set<string>} checked
   * @param {number} cap
   */
  export function visibleOptions(
    options,
    query,
    expanded,
    limit,
    counts,
    zeroCounts,
    checked,
    cap,
  ) {
    const needle = query.trim().toLowerCase();
    let pool = options;
    if (needle !== "") {
      pool = pool.filter((option) =>
        (option.label ?? String(option.id)).toLowerCase().includes(needle),
      );
    }
    if (zeroCounts === "hide" && counts) {
      pool = pool.filter(
        (option) =>
          (counts[String(option.id)] ?? 0) > 0 ||
          checked.has(String(option.id)),
      );
    }
    const total = pool.length;
    if (needle === "" && !expanded && total > limit) {
      pool = pool.filter(
        (option, index) => index < limit || checked.has(String(option.id)),
      );
    }
    const capped = pool.length > cap;
    return {
      items: capped ? pool.slice(0, cap) : pool,
      total,
      hidden: total - pool.length,
      capped,
    };
  }
</script>

<script>
  /**
   * @typedef {{ id: string | number, label?: string }} Option
   * @typedef {{
   *   searchLabel: (label: string) => string,
   *   showMore: (count: number) => string,
   *   showLess: string,
   *   noResults: string,
   *   capped: (shown: number, total: number) => string,
   * }} FilterTexts
   */

  /** @type {string} */
  export let id;
  /** @type {string} */
  export let label;
  /** @type {ReadonlyArray<Option>} */
  export let options = [];
  /** @type {ReadonlyArray<string | number>} */
  export let value = [];
  /** @type {Record<string, number> | undefined} */
  export let counts = undefined;
  /** @type {"disable" | "hide"} */
  export let zeroCounts = "disable";
  export let limit = 6;
  export let searchable = false;
  export let cap = 100;
  /** @type {FilterTexts} */
  export let texts;

  import { createEventDispatcher } from "svelte";
  import Button from "../Button/Button.svelte";
  import Checkbox from "../Checkbox/Checkbox.svelte";
  import CheckboxGroup from "../Checkbox/CheckboxGroup.svelte";
  import Search from "../Search/Search.svelte";

  const dispatch = createEventDispatcher();

  let query = "";
  let expanded = false;

  $: checked = new Set(value.map(String));
  $: view = visibleOptions(
    options,
    query,
    expanded,
    limit,
    counts,
    zeroCounts,
    checked,
    cap,
  );

  /** @param {CustomEvent<ReadonlyArray<string | number>>} event */
  function handleChange(event) {
    dispatch("change", event.detail);
  }

  function toggleExpanded() {
    expanded = !expanded;
  }
</script>

{#if searchable}
  <Search
    size="sm"
    bind:value={query}
    labelText={texts.searchLabel(label)}
    hideLabel
    placeholder={texts.searchLabel(label)}
  />
{/if}
<CheckboxGroup
  selected={value}
  legendText={label}
  hideLegend
  id="{id}-group"
  on:change={handleChange}
>
  {#each view.items as option (option.id)}
    {@const count = counts ? (counts[String(option.id)] ?? 0) : undefined}
    <Checkbox
      value={option.id}
      disabled={zeroCounts === "disable" &&
        count === 0 &&
        !checked.has(String(option.id))}
    >
      <svelte:fragment slot="labelChildren">
        <span class="bx--filter-panel__option">
          <span class="bx--filter-panel__option-label"
            >{option.label ?? option.id}</span
          >
          {#if count !== undefined}
            <span class="bx--filter-panel__count">{count}</span>
          {/if}
        </span>
      </svelte:fragment>
    </Checkbox>
  {/each}
</CheckboxGroup>
{#if view.total === 0}
  <p class="bx--filter-panel__empty" role="status">{texts.noResults}</p>
{/if}
{#if view.capped}
  <p class="bx--filter-panel__empty">
    {texts.capped(view.items.length, view.total)}
  </p>
{/if}
{#if query.trim() === "" && !expanded && view.hidden > 0}
  <Button
    kind="ghost"
    size="sm"
    aria-expanded="false"
    aria-controls="{id}-group"
    on:click={toggleExpanded}
  >
    {texts.showMore(view.hidden)}
  </Button>
{:else if query.trim() === "" && expanded && view.total > limit}
  <Button
    kind="ghost"
    size="sm"
    aria-expanded="true"
    aria-controls="{id}-group"
    on:click={toggleExpanded}
  >
    {texts.showLess}
  </Button>
{/if}
