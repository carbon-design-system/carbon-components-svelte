<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /** @typedef {Date | number | string} TimeLike */

  /**
   * The span type is written inline: a typedef cannot carry the generic
   * into the generated declarations.
   * @event {{ id: string; parent: string | null; depth: number; label: string; group: string; from: number; to: number; duration: number; offset: number; critical: boolean; datum: T; index: number } | null} hover Fires when the pointer or focus enters a span, and with `null` when it leaves.
   * @event {{ span: { id: string; parent: string | null; depth: number; label: string; group: string; from: number; to: number; duration: number; offset: number; critical: boolean; datum: T; index: number }; originalEvent: Event }} select Fires when a span is activated by click or keyboard. Requires `selectable`.
   * @event {{ id: string; collapsed: boolean }} toggle Fires when a span's children are folded away or shown.
   */

  /** @restProps {figure} */

  /**
   * Specify the spans, one row each.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read a span's id: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let id;

  /**
   * Specify how to read a span's parent id. A span with none is a root.
   * @type {import("../utils/accessor.js").Accessor<T, string | number | null | undefined>}
   */
  export let parent;

  /**
   * Specify how to read when a span starts: milliseconds, a `Date`, or a
   * date string. Offsets from the trace start work as well as times.
   * @type {import("../utils/accessor.js").Accessor<T, TimeLike>}
   */
  export let start;

  /**
   * Specify how to read how long a span took, in milliseconds. Give `end`
   * instead if the data has that.
   * @type {import("../utils/accessor.js").Accessor<T, number>}
   */
  export let duration = undefined;

  /**
   * Specify how to read when a span ends. Takes precedence over `duration`.
   * @type {import("../utils/accessor.js").Accessor<T, TimeLike>}
   */
  export let end = undefined;

  /**
   * Specify how to read a span's label. Defaults to its id.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let label = undefined;

  /**
   * Specify how to read what colors a span, such as its service. Without
   * one, every span takes the interactive color.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let group = undefined;

  /** Specify the title, shown as the table caption */
  export let title = "";

  /**
   * Specify the time range shown. Defaults to the earliest start and the
   * latest end.
   * @type {readonly [TimeLike, TimeLike]}
   */
  export let domain = undefined;

  /**
   * Specify a color per group: a semantic name such as `"error"`, a
   * categorical index, a viz token name, or any CSS color. Groups not named
   * take the categorical colors in first-seen order.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let groups = {};

  /**
   * Specify which of Carbon's prescribed color groups to use (1-based).
   */
  export let palette = 1;

  /**
   * Specify the ids whose children are folded away.
   * @type {ReadonlyArray<string | number>}
   */
  export let collapsed = [];

  /** Set to `false` to draw the critical path like any other span */
  export let criticalPath = true;

  /**
   * Set to `true` to label the axis with times of day rather than offsets
   * from the start. Suits spans whose `start` is a real time.
   */
  export let absolute = false;

  /** Set to `true` to place absolute ticks on UTC boundaries */
  export let utc = false;

  /**
   * Specify the size of a row.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /** Set to `false` to hide the legend */
  export let legend = true;

  /** Set to `true` to make spans selectable */
  export let selectable = false;

  /**
   * Specify the selected span, as its id.
   * @type {string | null}
   */
  export let selected = null;

  /**
   * Override the words used for assistive technology.
   * @type {{ span?: string; duration?: string; collapse?: string; expand?: string; critical?: string }}
   */
  export let words = {};

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import ChevronDown from "../../icons/ChevronDown.svelte";
  import { getDateTimeFormatter } from "../../utils/intl-formatter-cache.js";
  import { rovingFocus } from "../../utils/roving-focus.js";
  import { toAccessor } from "../utils/accessor.js";
  import { formatDuration } from "../utils/format-compact.js";
  import { buildSpans } from "./span-geometry.js";

  const dispatch = createEventDispatcher();

  let focusedIndex = 0;

  $: idOf = toAccessor(id);
  $: parentOf = toAccessor(parent);
  $: startOf = toAccessor(start);
  $: durationOf = duration === undefined ? undefined : toAccessor(duration);
  $: endOf = end === undefined ? undefined : toAccessor(end);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  $: groupOf = group === undefined ? undefined : toAccessor(group);
  // Depends on the data and the options only, so hover never rebuilds it.
  $: tree = buildSpans(data, {
    id: idOf,
    parent: parentOf,
    start: startOf,
    duration: durationOf,
    end: endOf,
    label: labelOf,
    group: groupOf,
    collapsed,
    domain,
    groups,
    palette,
    locale,
    utc,
    absolute,
  });
  $: text = {
    span: "Span",
    duration: "Duration",
    collapse: "Collapse",
    expand: "Expand",
    critical: "on the critical path",
    ...words,
  };
  $: writeTime = getDateTimeFormatter(locale, {
    timeStyle: "medium",
    ...(utc ? { timeZone: "UTC" } : {}),
  });
  $: describe = (/** @type {import("./span-geometry.js").SpanRow<T>} */ row) =>
    [
      row.group,
      formatDuration(row.duration, { locale }),
      absolute
        ? `at ${writeTime.format(row.from)}`
        : `${formatDuration(row.offset, { locale })} in`,
      criticalPath && row.critical ? text.critical : "",
    ]
      .filter(Boolean)
      .join(", ");
  $: tabStopIndex = Math.min(focusedIndex, Math.max(tree.rows.length - 1, 0));

  /** @param {import("./span-geometry.js").SpanRow<T>} row */
  function detail(row) {
    return {
      id: row.id,
      parent: row.parent,
      depth: row.depth,
      label: row.label,
      group: row.group,
      from: row.from,
      to: row.to,
      duration: row.duration,
      offset: row.offset,
      critical: row.critical,
      datum: row.datum,
      index: row.index,
    };
  }

  /** @param {import("./span-geometry.js").SpanRow<T> | null} row */
  function emit(row) {
    dispatch("hover", row ? detail(row) : null);
  }

  /**
   * @param {import("./span-geometry.js").SpanRow<T>} row
   * @param {Event} originalEvent
   */
  function select(row, originalEvent) {
    selected = selected === row.id ? null : row.id;
    focusedIndex = tree.rows.indexOf(row);
    dispatch("select", { span: detail(row), originalEvent });
  }

  /** @param {import("./span-geometry.js").SpanRow<T>} row */
  function toggle(row) {
    const closed = collapsed.map(String).includes(row.id);
    collapsed = closed
      ? collapsed.filter((entry) => String(entry) !== row.id)
      : [...collapsed, row.id];
    dispatch("toggle", { id: row.id, collapsed: !closed });
  }

  /**
   * Roving focus across the span buttons, attached only while `selectable`,
   * so a static waterfall adds no listeners.
   *
   * @param {HTMLElement} node
   * @param {boolean} enabled
   */
  function rovingSpans(node, enabled) {
    /** @type {ReturnType<typeof rovingFocus> | undefined} */
    let roving;
    /** @param {boolean} on */
    function sync(on) {
      if (on && !roving) {
        roving = rovingFocus(node, {
          selector: ".bx--viz-timeline__button",
          orientation: "vertical",
          focusOnMove: true,
          getActiveIndex: () => tabStopIndex,
          onMove: (index, event) => {
            event.preventDefault();
            focusedIndex = index;
          },
        });
      } else if (!on && roving) {
        roving.destroy();
        roving = undefined;
      }
    }
    sync(enabled);
    return { update: sync, destroy: () => sync(false) };
  }
</script>

<figure
  bind:this={ref}
  class:bx--viz-timeline={true}
  class:bx--viz-timeline--spans={true}
  class:bx--viz-timeline--sm={size === "sm"}
  class:bx--viz-timeline--lg={size === "lg"}
  class:bx--viz-timeline--selectable={selectable}
  {...$$restProps}
>
  <table class:bx--viz-timeline__table={true} use:rovingSpans={selectable}>
    {#if title}
      <caption class:bx--viz-chart__title={true}>
        {title}
      </caption>
    {/if}
    <thead class:bx--visually-hidden={true}>
      <tr>
        <th scope="col">{text.span}</th>
        <th scope="col">{text.duration}</th>
      </tr>
    </thead>
    <tbody>
      {#each tree.rows as row (row.id)}
        <tr
          class:bx--viz-spans__row={true}
          class:bx--viz-spans__row--critical={criticalPath && row.critical}
          style:--bx-viz-depth={row.depth}
        >
          <th scope="row" class:bx--viz-timeline__label={true}>
            <span class:bx--viz-spans__name={true}>
              {#if row.children > 0}
                <button
                  type="button"
                  class:bx--viz-spans__toggle={true}
                  aria-expanded={!row.collapsed}
                  aria-label="{row.collapsed ? text.expand : text.collapse} {row.label}"
                  on:click={() => toggle(row)}
                >
                  <ChevronDown size={16} />
                </button>
              {/if}
              {row.label}
            </span>
          </th>
          <td class:bx--viz-timeline__track-cell={true}>
            <div class:bx--viz-timeline__track={true}>
              {#if selectable}
                <button
                  type="button"
                  class:bx--viz-timeline__segment={true}
                  class:bx--viz-timeline__button={true}
                  class:bx--viz-timeline__segment--selected={row.id === selected}
                  tabindex={tree.rows.indexOf(row) === tabStopIndex ? 0 : -1}
                  aria-pressed={row.id === selected}
                  aria-label="{row.label}: {describe(row)}"
                  title={describe(row)}
                  style:--bx-viz-color={row.color}
                  style:--bx-viz-start={row.startPct}
                  style:--bx-viz-pct={row.widthPct}
                  on:click={(event) => select(row, event)}
                  on:mouseenter={() => emit(row)}
                  on:mouseleave={() => emit(null)}
                  on:focus={() => {
                    focusedIndex = tree.rows.indexOf(row);
                    emit(row);
                  }}
                  on:blur={() => emit(null)}
                ></button>
              {:else}
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <!-- svelte-ignore a11y-mouse-events-have-key-events -->
                <span
                  class:bx--viz-timeline__segment={true}
                  title={describe(row)}
                  style:--bx-viz-color={row.color}
                  style:--bx-viz-start={row.startPct}
                  style:--bx-viz-pct={row.widthPct}
                  on:mouseenter={() => emit(row)}
                  on:mouseleave={() => emit(null)}
                >
                  <span class:bx--visually-hidden={true}>{describe(row)}</span>
                </span>
              {/if}
              <span
                class:bx--viz-spans__duration={true}
                aria-hidden="true"
                style:--bx-viz-start={row.startPct + row.widthPct}
              >
                {formatDuration(row.duration, { locale })}
              </span>
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
    <tfoot aria-hidden="true">
      <tr>
        <td></td>
        <td class:bx--viz-timeline__axis-cell={true}>
          <div class:bx--viz-timeline__axis={true}>
            {#each tree.ticks as tick (tick.value)}
              <span
                class:bx--viz-timeline__tick={true}
                style:--bx-viz-start={tick.pct}
              >
                {tick.label}
              </span>
            {/each}
          </div>
        </td>
      </tr>
    </tfoot>
  </table>
  {#if legend && tree.groups.length > 0}
    <ul class:bx--viz-treemap__legend={true} aria-hidden="true">
      {#each tree.groups as entry (entry.key)}
        <li
          class:bx--viz-treemap__legend-item={true}
          style:--bx-viz-color={entry.color}
        >
          <span class:bx--viz-treemap__swatch={true}></span>
          {entry.key}
        </li>
      {/each}
    </ul>
  {/if}
</figure>
