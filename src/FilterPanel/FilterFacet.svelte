<script>
  /**
   * One facet's control. `FilterPanel` renders it inside an accordion item.
   * It fires `change` with the facet's next value, or `undefined` when the
   * facet no longer filters.
   *
   * @typedef {import("./filter-model.js").Facet} Facet
   * @typedef {import("./FilterCheckboxFacet.svelte").FilterTexts} FilterTexts
   */

  /** @type {Facet} */
  export let facet;
  /** @type {unknown} */
  export let value = undefined;
  /** @type {Record<string, number> | undefined} */
  export let counts = undefined;
  /** @type {ReadonlyArray<{ id: string | number, label?: string }>} */
  export let options = [];
  /** @type {"disable" | "hide"} */
  export let zeroCounts = "disable";
  /** @type {string} */
  export let anyText = "Any";
  /** @type {string} */
  export let fromText = "From";
  /** @type {string} */
  export let toText = "To";
  /** @type {string} */
  export let minText = "Min";
  /** @type {string} */
  export let maxText = "Max";
  /** @type {string} */
  export let id;
  export let cap = 100;
  /** @type {FilterTexts} */
  export let texts;
  /** @type {string} */
  export let dateFormat = "Y-m-d";
  /** @type {string} */
  export let datePlaceholder = "yyyy-mm-dd";

  import { createEventDispatcher } from "svelte";
  import DatePicker from "../DatePicker/DatePicker.svelte";
  import DatePickerInput from "../DatePicker/DatePickerInput.svelte";
  import NumberInput from "../NumberInput/NumberInput.svelte";
  import RadioButton from "../RadioButton/RadioButton.svelte";
  import RadioButtonGroup from "../RadioButtonGroup/RadioButtonGroup.svelte";
  import RangeSlider from "../Slider/RangeSlider.svelte";
  import Toggle from "../Toggle/Toggle.svelte";
  import TreeView from "../TreeView/TreeView.svelte";
  import FilterCheckboxFacet from "./FilterCheckboxFacet.svelte";
  import {
    compactTreeIds,
    expandTreeIds,
    normalizeFacetValue,
    treeIndex,
  } from "./filter-model.js";

  const dispatch = createEventDispatcher();

  /** @param {unknown} next */
  function commit(next) {
    dispatch("change", normalizeFacetValue(facet, next));
  }

  /* range */
  let lower = 0;
  let upper = 0;
  /** @param {import("./filter-model.js").RangeFacet} f @param {unknown} v */
  function syncRange(f, v) {
    const [lo, hi] = Array.isArray(v) ? v : [null, null];
    lower = lo ?? f.min;
    upper = hi ?? f.max;
  }
  $: if (facet.type === "range") syncRange(facet, value);

  function commitRange() {
    if (facet.type !== "range") return;
    const lo = lower <= facet.min ? null : lower;
    const hi = upper >= facet.max ? null : upper;
    commit(lo === null && hi === null ? undefined : [lo, hi]);
  }

  /**
   * @param {number | null} lo
   * @param {number | null} hi
   */
  function commitInput(lo, hi) {
    if (facet.type !== "range") return;
    lower = Math.min(Math.max(lo ?? facet.min, facet.min), facet.max);
    upper = Math.min(Math.max(hi ?? facet.max, facet.min), facet.max);
    commitRange();
  }

  /* date */
  let from = "";
  let to = "";
  /** @param {unknown} v */
  function syncDate(v) {
    const [lo, hi] = Array.isArray(v) ? v : [null, null];
    from = lo ?? "";
    to = hi ?? "";
  }
  $: if (facet.type === "date") syncDate(value);

  function commitDate() {
    if (!from && !to) commit(undefined);
    else commit([from || null, to || null]);
  }

  /* radio */
  /** @param {CustomEvent<string | number | null>} event */
  function commitRadio(event) {
    const next = event.detail;
    commit(next === null || next === "" ? undefined : next);
  }

  /* toggle */
  /** @param {CustomEvent<{ toggled: boolean }>} event */
  function commitToggle(event) {
    commit(event.detail.toggled ? true : undefined);
  }

  /* tree */
  /**
   * @param {ReadonlyArray<import("./filter-model.js").FilterOption>} nodes
   * @param {Record<string, number> | undefined} nodeCounts
   * @param {"disable" | "hide"} zero
   * @param {Set<string>} checkedKeys
   * @returns {any[]}
   */
  function treeNodes(nodes, nodeCounts, zero, checkedKeys) {
    return nodes.map((node) => {
      const count = nodeCounts ? (nodeCounts[String(node.id)] ?? 0) : undefined;
      const text = node.label ?? String(node.id);
      return {
        id: node.id,
        text: count === undefined ? text : `${text} (${count})`,
        disabled:
          zero === "disable" &&
          count === 0 &&
          !checkedKeys.has(String(node.id)),
        nodes: node.children
          ? treeNodes(node.children, nodeCounts, zero, checkedKeys)
          : undefined,
      };
    });
  }

  // A tree facet is a short list of categories: start with every branch open,
  // so a checked leaf is never out of sight.
  /** @type {Array<string | number>} */
  let expandedIds =
    facet.type === "tree" ? [...treeIndex(facet).down.keys()] : [];

  $: treeChecked =
    facet.type === "tree"
      ? expandTreeIds(facet, Array.isArray(value) ? value : [])
      : [];
  $: nodes =
    facet.type === "tree"
      ? treeNodes(facet.options, counts, zeroCounts, new Set(treeChecked))
      : [];

  /** @param {CustomEvent<{ checkedIds: ReadonlyArray<string | number> }>} event */
  function commitTree(event) {
    if (facet.type !== "tree") return;
    commit(compactTreeIds(facet, [...event.detail.checkedIds]));
  }
</script>

{#if facet.type === "checkbox"}
  <FilterCheckboxFacet
    {id}
    label={facet.label}
    {options}
    value={Array.isArray(value) ? value : []}
    {counts}
    {zeroCounts}
    limit={facet.limit ?? 6}
    searchable={facet.searchable ?? options.length > 12}
    {texts}
    {cap}
    on:change={(event) => commit(event.detail)}
  />
{:else if facet.type === "radio"}
  <RadioButtonGroup
    legendText={facet.label}
    hideLegend
    orientation="vertical"
    selected={value === undefined ? "" : /** @type {string | number} */ (value)}
    on:change={commitRadio}
  >
    <RadioButton value="" labelText={anyText} />
    {#each options as option (option.id)}
      {@const count = counts ? (counts[String(option.id)] ?? 0) : undefined}
      <RadioButton
        value={option.id}
        disabled={zeroCounts === "disable" &&
          count === 0 &&
          String(value) !== String(option.id)}
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
      </RadioButton>
    {/each}
  </RadioButtonGroup>
{:else if facet.type === "range"}
  <fieldset class="bx--fieldset">
    <legend class="bx--visually-hidden">{facet.label}</legend>
    <RangeSlider
      labelText={facet.label}
      hideLabel
      min={facet.min}
      max={facet.max}
      step={facet.step ?? 1}
      formatValue={facet.format}
      fullWidth
      hideTextInput
      bind:value={lower}
      bind:valueUpper={upper}
      on:change={commitRange}
    />
    <div class="bx--filter-panel__range-inputs">
      <NumberInput
        size="sm"
        labelText={minText}
        min={facet.min}
        max={upper}
        step={facet.step ?? 1}
        hideSteppers
        allowEmpty
        value={lower}
        on:change={(event) => commitInput(event.detail, upper)}
      />
      <NumberInput
        size="sm"
        labelText={maxText}
        min={lower}
        max={facet.max}
        step={facet.step ?? 1}
        hideSteppers
        allowEmpty
        value={upper}
        on:change={(event) => commitInput(lower, event.detail)}
      />
    </div>
  </fieldset>
{:else if facet.type === "date"}
  <fieldset class="bx--fieldset">
    <legend class="bx--visually-hidden">{facet.label}</legend>
    <DatePicker
      datePickerType="range"
      {dateFormat}
      minDate={facet.min ?? null}
      maxDate={facet.max ?? null}
      bind:valueFrom={from}
      bind:valueTo={to}
      on:change={commitDate}
    >
      <DatePickerInput
        labelText={fromText}
        placeholder={datePlaceholder}
        size="sm"
      />
      <DatePickerInput
        labelText={toText}
        placeholder={datePlaceholder}
        size="sm"
      />
    </DatePicker>
  </fieldset>
{:else if facet.type === "toggle"}
  {@const count = counts ? (counts.true ?? 0) : undefined}
  <fieldset class="bx--fieldset bx--filter-panel__toggle">
    <legend class="bx--visually-hidden">{facet.label}</legend>
    <Toggle
      size="sm"
      toggled={value === true}
      disabled={zeroCounts === "disable" && count === 0 && value !== true}
      labelText={facet.toggleLabel ?? facet.label}
      hideLabel
      labelA={facet.toggleLabel ?? facet.label}
      labelB={facet.toggleLabel ?? facet.label}
      on:toggle={commitToggle}
    />
    {#if count !== undefined}
      <span class="bx--filter-panel__count">{count}</span>
    {/if}
  </fieldset>
{:else if facet.type === "tree"}
  <fieldset class="bx--fieldset">
    <legend class="bx--visually-hidden">{facet.label}</legend>
    <TreeView
      {nodes}
      labelText={facet.label}
      hideLabel
      size="compact"
      bind:expandedIds
      selectionMode="checkbox"
      checkedIds={treeChecked}
      on:check:change={commitTree}
    />
  </fieldset>
{/if}
