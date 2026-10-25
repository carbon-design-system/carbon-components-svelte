<script>
  /**
   * @template T
   */

  /**
   * @event {{ id: string; label: string; status: string; datum: T } | null} hover Fires when the pointer or focus moves to another cell, and with `null` when it leaves.
   * @event {{ id: string; label: string; status: string; datum: T; originalEvent: Event }} select Fires when a cell is activated by click, Enter, or Space.
   */

  /**
   * Specify the rows, one per cell. Reassign the array to update.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read a cell's id: a key or a function of the row.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let id;

  /**
   * Specify how to read a cell's label, for the tooltip and assistive
   * technology. Defaults to the id.
   * @type {import("../utils/accessor.js").Accessor<T, string | number> | undefined}
   */
  export let label = undefined;

  /**
   * Specify how to read a cell's status, a key of `states`.
   * @type {import("../utils/accessor.js").Accessor<T, string>}
   */
  export let status;

  /**
   * Specify the states a cell can be in, in legend order: a color and a
   * label each. Defaults to the status colors.
   * @type {Record<string, { color: import("../utils/tokens.js").VizColor; label: string }>}
   */
  export let states = {
    healthy: { color: "success", label: "Healthy" },
    degraded: { color: "warning", label: "Degraded" },
    failed: { color: "error", label: "Failed" },
    pending: { color: "neutral", label: "Pending" },
  };

  /** Specify the title of the grid, also its accessible name */
  export let title = "";

  /**
   * Specify the size of a cell.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /** Set to `false` to hide the legend */
  export let legend = true;

  /** Set to `true` to show the loading state */
  export let loading = false;

  /** Set to `true` to show the error state instead of the data */
  export let error = false;

  /** Specify the text shown when there is no data */
  export let emptyText = "No data";

  /** Specify the text shown in the error state */
  export let errorText = "Could not load this chart";

  /** Set to `true` to make the cells selectable toggles */
  export let selectable = false;

  /**
   * Specify the selected cell's id. Bind it.
   * @type {string | number | null}
   */
  export let selected = null;

  /**
   * Obtain a reference to the figure element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { vizColor } from "../utils/tokens.js";
  import { createTooltipTiming } from "../utils/tooltip-timing.js";

  const dispatch = createEventDispatcher();
  const tooltipTiming = createTooltipTiming(150, {
    onUnpin: () => setActive(null),
    onHide: () => setActive(null),
  });
  const { shown: tooltipShown, pinned: tooltipPinned } = tooltipTiming;

  $: idOf = toAccessor(id);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  $: statusOf = toAccessor(status);
  $: cells = data.map((row, i) => {
    const key = String(idOf(row, i));
    const state = String(statusOf(row, i));
    return {
      id: key,
      label: labelOf ? String(labelOf(row, i)) : key,
      status: state,
      color: vizColor(states[state]?.color ?? "neutral"),
      datum: row,
    };
  });
  $: counts = Object.keys(states).map((key) => ({
    key,
    label: states[key].label,
    color: vizColor(states[key].color),
    count: cells.filter((cell) => cell.status === key).length,
  }));
  $: empty = !loading && !error && data.length === 0;

  /** @type {(typeof cells)[number] | null} */
  let active = null;
  $: tooltipTiming.settle(active);

  // The tooltip sits above the hovered cell, centered on it, so the pointer
  // and the cell stay in view and it covers as few neighbors as it can.
  /** @type {{ left: number; top: number } | null} */
  let anchor = null;

  /**
   * Keeps the tooltip inside the grid, as a cell may sit at either edge.
   * @param {HTMLElement} node
   * @param {number} center
   */
  function clamp(node, center) {
    const place = (/** @type {number} */ x) => {
      const half = node.offsetWidth / 2;
      const max =
        /** @type {HTMLElement} */ (node.parentElement).clientWidth - half;
      node.style.left = `${Math.min(Math.max(x, half), Math.max(half, max))}px`;
    };
    place(center);
    return { update: place };
  }

  /**
   * @param {(typeof cells)[number] | null} cell
   * @param {HTMLElement | null} [node] The cell's element, to anchor the tooltip.
   */
  function setActive(cell, node = null) {
    if (node) {
      anchor = {
        left: node.offsetLeft + node.offsetWidth / 2,
        top: node.offsetTop,
      };
    }
    if (cell === active) return;
    active = cell;
    dispatch(
      "hover",
      cell
        ? {
            id: cell.id,
            label: cell.label,
            status: cell.status,
            datum: cell.datum,
          }
        : null,
    );
  }

  /**
   * @param {(typeof cells)[number]} cell
   * @param {Event} originalEvent
   */
  function select(cell, originalEvent) {
    selected = selected === cell.id ? null : cell.id;
    dispatch("select", { ...cell, originalEvent });
  }
</script>

<figure
  bind:this={ref}
  class:bx--viz-status-grid={true}
  class:bx--viz-status-grid--sm={size === "sm"}
  class:bx--viz-status-grid--lg={size === "lg"}
  class:bx--viz-chart--loading={loading}
  class:bx--viz-chart--empty={empty}
  class:bx--viz-chart--error={error}
  aria-busy={loading ? "true" : undefined}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  {#if loading}
    <div class:bx--viz-chart__state={true} aria-hidden="true">
      <div
        class:bx--viz-chart__skeleton={true}
        class:bx--skeleton__placeholder={true}
      ></div>
    </div>
  {:else if error}
    <div class:bx--viz-chart__state={true}>
      <div class:bx--viz-chart__error={true}>
        <slot name="error">{errorText}</slot>
      </div>
    </div>
  {:else if empty}
    <div class:bx--viz-chart__state={true}>
      <div class:bx--viz-chart__empty={true}>
        <slot name="empty">{emptyText}</slot>
      </div>
    </div>
  {/if}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class:bx--viz-status-grid__body={true}
    use:tooltipTiming.track
    on:mouseleave={tooltipTiming.leave}
  >
    <ul class:bx--viz-status-grid__cells={true} aria-label={title || undefined}>
      {#each cells as cell (cell.id)}
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <li
          class:bx--viz-status-grid__cell={true}
          class:bx--viz-status-grid__cell--active={active === cell}
          class:bx--viz-status-grid__cell--selected={selectable &&
            selected === cell.id}
          style:--bx-viz-color={cell.color}
          on:mouseenter={(event) => {
            const node = event.currentTarget;
            tooltipTiming.enter(() => setActive(cell, node));
          }}
          on:mouseleave={tooltipTiming.leave}
        >
          {#if selectable}
            <button
              type="button"
              class:bx--viz-status-grid__button={true}
              aria-pressed={selected === cell.id}
              aria-label="{cell.label}: {states[cell.status]?.label ??
                cell.status}"
              on:click={(event) => select(cell, event)}
              on:focus={(event) =>
                setActive(cell, event.currentTarget.parentElement)}
              on:blur={() => $tooltipPinned || setActive(null)}
            ></button>
          {:else}
            <span class:bx--visually-hidden={true}>
              {cell.label}: {states[cell.status]?.label ?? cell.status}
            </span>
          {/if}
        </li>
      {/each}
    </ul>
    {#if active && anchor && $tooltipShown}
      <div
        class:bx--viz-chart-tooltip={true}
        style:top="{anchor.top}px"
        use:clamp={anchor.left}
        aria-hidden="true"
      >
        <div class:bx--viz-chart-tooltip__title={true}>{active.label}</div>
        <div class:bx--viz-chart-tooltip__row={true}>
          <span
            class:bx--viz-chart-tooltip__swatch={true}
            style:--bx-viz-color={active.color}
          ></span>
          <span class:bx--viz-chart-tooltip__label={true}>
            {states[active.status]?.label ?? active.status}
          </span>
        </div>
      </div>
    {/if}
  </div>
  {#if legend && (cells.length > 0 || loading || empty || error)}
    <div class:bx--viz-legend={true} role="group" aria-label="States">
      {#each counts as entry (entry.key)}
        <span
          class:bx--viz-legend__item={true}
          style:--bx-viz-color={entry.color}
        >
          <span class:bx--viz-legend__swatch={true}></span>
          {entry.label}
          <span class:bx--viz-status-grid__count={true}>{entry.count}</span>
        </span>
      {/each}
    </div>
  {/if}
</figure>
