<script>
  /**
   * @event {{ config: import("./pivot.js").PivotConfig }} change - Fires after a field moves, an aggregate changes or a filter changes.
   * @event {{ field: string; from: import("./pivot-config.js").PivotZone; to: import("./pivot-config.js").PivotZone; index: number | undefined }} move - Fires before a field moves. Cancelable: call `preventDefault()` to keep the config as it is.
   * @restProps {div}
   */

  /**
   * Specify the fields of the records.
   * @type {ReadonlyArray<import("./pivot-config.js").PivotField>}
   */
  export let fields = [];

  /**
   * Specify which fields are the rows, the columns, the values and the filters.
   * Moving a field assigns a new object; the old one is not edited.
   * @type {import("./pivot.js").PivotConfig}
   * @bindable writable
   */
  export let config = {};

  /**
   * Specify the records, so a filter can list the values to choose from.
   * Without them a filter's field menu has no values.
   * @type {ReadonlyArray<Record<string, any>> | undefined}
   */
  export let records = undefined;

  /** Specify the most values a filter lists */
  export let filterValueLimit = 50;

  /** Specify the name of the list */
  export let labelText = "Pivot fields";

  /** Set to `true` to hide the label visually. It still names the list. */
  export let hideLabel = false;

  /** Specify the name of the area with the fields in no row, column or filter */
  export let fieldsText = "Fields";

  /** Specify the name of the rows area */
  export let rowsText = "Rows";

  /** Specify the name of the columns area */
  export let columnsText = "Columns";

  /** Specify the name of the values area */
  export let valuesText = "Values";

  /** Specify the name of the filters area */
  export let filtersText = "Filters";

  /** Specify the text of an empty area */
  export let emptyText = "Drag a field here, or use its menu.";

  /** Specify the label of a blank filter value */
  export let blankText = "(blank)";

  /** Specify the label of the menu item that removes a field */
  export let removeText = "Remove";

  /** Specify the label of the menu item that moves a field up */
  export let moveUpText = "Move up";

  /** Specify the label of the menu item that moves a field down */
  export let moveDownText = "Move down";

  /** Specify the label of the menu item that opens the aggregates */
  export let summarizeText = "Summarize by";

  /** Specify the label of the menu item that opens the filter values */
  export let filterValuesText = "Show values";

  /**
   * Specify the label of the menu item that moves a field to an area.
   * @type {(area: string) => string}
   */
  export let moveToText = (area) => `Move to ${area}`;

  /**
   * Specify the accessible name of a field's menu.
   * @type {(label: string) => string}
   */
  export let menuDescription = (label) => `Actions for ${label}`;

  /**
   * Specify the announcement after a field moves.
   * @type {(label: string, area: string) => string}
   */
  export let movedDescription = (label, area) => `${label} moved to ${area}`;

  /**
   * Specify the name of an aggregate, by name.
   * @type {Record<string, string>}
   */
  export let aggregateText = {
    sum: "Sum",
    count: "Count",
    avg: "Average",
    min: "Min",
    max: "Max",
    countDistinct: "Distinct count",
    custom: "Custom",
  };

  /**
   * Specify the label of a value, from its aggregate's name and its field's.
   * @type {(aggregate: string, field: string) => string}
   */
  export let valueText = (aggregate, field) => `${aggregate} of ${field}`;

  /** Specify the id of the list. Inner ids derive from it. */
  export let id = uniqueId();

  import { createEventDispatcher, tick } from "svelte";
  import MenuDivider from "../Menu/MenuDivider.svelte";
  import MenuItem from "../Menu/MenuItem.svelte";
  import MenuButton from "../MenuButton/MenuButton.svelte";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { uniqueId } from "../utils/unique-id.js";
  import {
    distinctValues,
    fieldOf,
    moveField,
    setAggregate,
    setFilterInclude,
    shiftEntry,
    zoneEntries,
  } from "./pivot-config.js";

  const dispatch = createEventDispatcher();

  /** @type {import("./pivot-config.js").PivotZone[]} */
  const ZONES = ["available", "rows", "columns", "values", "filters"];
  const AGGREGATES = ["sum", "count", "avg", "min", "max", "countDistinct"];
  const DRAG_THRESHOLD = 4;

  $: names = {
    available: fieldsText,
    rows: rowsText,
    columns: columnsText,
    values: valuesText,
    filters: filtersText,
  };
  $: labelOf = Object.fromEntries(fields.map((f) => [f.key, f.label ?? f.key]));
  $: zones = ZONES.map((zone) => ({
    zone,
    entries: zoneEntries(config, fields, zone),
  }));

  /**
   * @param {import("./pivot-config.js").PivotZone} zone
   * @param {any} entry
   * @param {Record<string, string>} labels
   * @param {Record<string, string>} aggregates
   */
  function chipLabel(zone, entry, labels, aggregates) {
    const field = fieldOf(entry) ?? "";
    const label = labels[field] ?? field;
    if (zone !== "values") return label;
    if (entry.label) return entry.label;
    const aggregate =
      aggregates[
        typeof entry.aggregate === "function"
          ? "custom"
          : (entry.aggregate ?? "sum")
      ];
    return entry.field ? valueText(aggregate, label) : aggregates.count;
  }

  let liveText = "";

  /**
   * @param {string} field
   * @param {import("./pivot-config.js").PivotZone} from
   * @param {number | undefined} fromIndex
   * @param {import("./pivot-config.js").PivotZone} to
   * @param {number | undefined} toIndex
   * @param {boolean} [focus] - Move focus to the field's menu after.
   */
  async function move(field, from, fromIndex, to, toIndex, focus = false) {
    if (from === to && to === "available") return;
    const proceed = dispatch(
      "move",
      { field, from, to, index: toIndex },
      { cancelable: true },
    );
    if (!proceed) return;
    config = moveField(config, { field, from, fromIndex, to, toIndex }, fields);
    dispatch("change", { config });
    liveText = movedDescription(labelOf[field] ?? field, names[to]);
    if (focus) {
      await tick();
      /** @type {HTMLElement | null | undefined} */ (
        root?.querySelector(
          `[data-pivot-zone="${to}"] [data-pivot-field="${CSS.escape(field)}"] button`,
        )
      )?.focus();
    }
  }

  /**
   * @param {import("./pivot-config.js").PivotZone} zone
   * @param {number} index
   * @param {-1 | 1} step
   * @param {string} field
   */
  async function shift(zone, index, step, field) {
    if (zone === "available") return;
    config = shiftEntry(config, zone, index, step);
    dispatch("change", { config });
    await tick();
    root
      ?.querySelectorAll(`[data-pivot-zone="${zone}"] [data-pivot-index]`)
      [index + step]?.querySelector("button")
      ?.focus();
    liveText = movedDescription(labelOf[field] ?? field, names[zone]);
  }

  /**
   * @param {number} index
   * @param {string} aggregate
   */
  function summarize(index, aggregate) {
    config = setAggregate(config, index, /** @type {any} */ (aggregate));
    dispatch("change", { config });
  }

  /**
   * @param {string} field
   * @param {unknown} value - `null` for the blank group.
   * @param {unknown[]} all
   */
  function toggleFilter(field, value, all) {
    const filter = (config.filters ?? []).find((f) => f.field === field);
    const current = filter?.include ?? all;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    config = setFilterInclude(
      config,
      field,
      next.length === all.length ? undefined : next,
    );
    dispatch("change", { config });
  }

  // ---- Dragging -------------------------------------------------------

  /** @type {null | HTMLElement} */
  let root = null;

  /**
   * @type {null | {
   *   field: string,
   *   label: string,
   *   from: import("./pivot-config.js").PivotZone,
   *   fromIndex: number,
   *   x0: number,
   *   y0: number,
   *   x: number,
   *   y: number,
   *   started: boolean,
   *   over: import("./pivot-config.js").PivotZone | null,
   *   gap: number,
   * }}
   */
  let drag = null;

  /**
   * @param {PointerEvent} event
   * @param {import("./pivot-config.js").PivotZone} zone
   * @param {string} field
   * @param {string} label
   * @param {number} index
   */
  function startDrag(event, zone, field, label, index) {
    // A press on the menu button is a click, not a drag.
    if (/** @type {Element} */ (event.target).closest("button")) return false;
    drag = {
      field,
      label,
      from: zone,
      fromIndex: index,
      x0: event.clientX,
      y0: event.clientY,
      x: event.clientX,
      y: event.clientY,
      started: false,
      over: null,
      gap: 0,
    };
  }

  /** @param {PointerEvent} event */
  function moveDrag(event) {
    if (!drag) return;
    const { clientX: x, clientY: y } = event;
    if (
      !drag.started &&
      Math.hypot(x - drag.x0, y - drag.y0) < DRAG_THRESHOLD
    ) {
      return;
    }
    const zoneEl = document
      .elementFromPoint(x, y)
      ?.closest("[data-pivot-zone]");
    let over = null;
    let gap = 0;
    if (zoneEl instanceof HTMLElement) {
      over = /** @type {import("./pivot-config.js").PivotZone} */ (
        zoneEl.dataset.pivotZone
      );
      const items = zoneEl.querySelectorAll("[data-pivot-index]");
      gap = items.length;
      for (let i = 0; i < items.length; i++) {
        const box = items[i].getBoundingClientRect();
        if (y < box.top + box.height / 2) {
          gap = i;
          break;
        }
      }
    }
    drag = { ...drag, x, y, started: true, over, gap };
  }

  /** @param {PointerEvent} [event] */
  function endDrag(event) {
    const done = drag;
    drag = null;
    if (!done?.started || !done.over || event?.type === "pointercancel") return;
    move(
      done.field,
      done.from,
      done.fromIndex,
      done.over,
      done.over === "available" ? undefined : done.gap,
    );
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.key === "Escape" && drag) drag = null;
  }

  /**
   * @param {import("./pivot-config.js").PivotZone} zone
   * @returns {import("./pivot-config.js").PivotZone[]}
   */
  function targets(zone) {
    return ZONES.filter((z) => z !== zone && z !== "available");
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div
  bind:this={root}
  {...$$restProps}
  role="group"
  aria-labelledby={$$restProps["aria-labelledby"] ??
    ($$restProps["aria-label"] ? undefined : `${id}-label`)}
  class={["bx--pivot-fields", $$restProps.class].filter(Boolean).join(" ")}
>
  <div
    id="{id}-label"
    class:bx--pivot-fields__label={true}
    class:bx--visually-hidden={hideLabel}
  >
    {labelText}
  </div>
  <div class="bx--pivot-fields__zones">
    {#each zones as { zone, entries } (zone)}
      <div
        role="group"
        aria-labelledby="{id}-{zone}"
        data-pivot-zone={zone}
        class="bx--pivot-fields__zone"
        class:bx--pivot-fields__zone--over={drag?.started && drag.over === zone}
      >
        <div id="{id}-{zone}" class="bx--pivot-fields__zone-name">
          {names[zone]}
        </div>
        <ul class="bx--pivot-fields__list">
          {#each entries as { field, entry }, i (`${field}:${i}`)}
            {@const label = chipLabel(zone, entry, labelOf, aggregateText)}
            <li
              class="bx--pivot-fields__item"
              class:bx--pivot-fields__item--dragging={drag?.started &&
                drag.field === field &&
                drag.from === zone &&
                drag.fromIndex === i}
              class:bx--pivot-fields__item--drop={drag?.started &&
                drag.over === zone &&
                zone !== "available" &&
                drag.gap === i}
              data-pivot-field={field}
              data-pivot-index={i}
              use:pointerDrag={{
                onStart: (event) => startDrag(event, zone, field, label, i),
                onMove: moveDrag,
                onEnd: endDrag,
              }}
            >
              <span class="bx--pivot-fields__text">{label}</span>
              <MenuButton iconOnly size="xs" labelText={menuDescription(label)}>
                {#each targets(zone) as target (target)}
                  <MenuItem
                    labelText={moveToText(names[target])}
                    on:click={() =>
                      move(field, zone, i, target, undefined, true)}
                  />
                {/each}
                {#if zone !== "available"}
                  <MenuItem
                    labelText={moveUpText}
                    disabled={i === 0}
                    on:click={() => shift(zone, i, -1, field)}
                  />
                  <MenuItem
                    labelText={moveDownText}
                    disabled={i === entries.length - 1}
                    on:click={() => shift(zone, i, 1, field)}
                  />
                {/if}
                {#if zone === "values"}
                  <MenuDivider />
                  <MenuItem labelText={summarizeText}>
                    {#each AGGREGATES as aggregate (aggregate)}
                      <MenuItem
                        selectable
                        selected={(entry.aggregate ?? "sum") === aggregate}
                        labelText={aggregateText[aggregate]}
                        on:click={() => summarize(i, aggregate)}
                      />
                    {/each}
                  </MenuItem>
                {/if}
                {#if zone === "filters" && records}
                  {@const found = distinctValues(
                    records,
                    field,
                    filterValueLimit,
                  )}
                  {@const all = found.blank
                    ? [...found.values, null]
                    : found.values}
                  <MenuDivider />
                  <MenuItem labelText={filterValuesText}>
                    {#each all as value (value)}
                      <MenuItem
                        selectable
                        selected={entry.include
                          ? entry.include.includes(value)
                          : true}
                        labelText={value === null ? blankText : String(value)}
                        on:click={() => toggleFilter(field, value, all)}
                      />
                    {/each}
                  </MenuItem>
                {/if}
                {#if zone !== "available"}
                  <MenuDivider />
                  <MenuItem
                    kind="danger"
                    labelText={removeText}
                    on:click={() =>
                      move(field, zone, i, "available", undefined, true)}
                  />
                {/if}
              </MenuButton>
            </li>
          {:else}
            <li class="bx--pivot-fields__empty">{emptyText}</li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
  <div class:bx--visually-hidden={true} aria-live="polite" role="status">
    {liveText}
  </div>
  {#if drag?.started}
    <div
      class="bx--pivot-fields__ghost"
      aria-hidden="true"
      style:left="{drag.x}px"
      style:top="{drag.y}px"
    >
      {drag.label}
    </div>
  {/if}
</div>
