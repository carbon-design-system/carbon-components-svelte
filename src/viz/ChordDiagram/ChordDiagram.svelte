<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @event {{ kind: "group"; key: string; out: number; in: number; total: number } | { kind: "ribbon"; source: string; target: string; forward: number; backward: number; value: number; rows: T[] } | null} hover Fires when the pointer or keyboard focus moves to another group or ribbon, and with `null` when it leaves.
   * @event {{ key: string; out: number; in: number; total: number; ribbons: Array<{ source: string; target: string; forward: number; backward: number; value: number; rows: T[] }>; originalEvent: Event }} select Fires when the focused group is activated by click, Enter, or Space.
   */

  /** @restProps {figure} */

  /**
   * Specify the flows, one row each.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read a flow's source: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let source;

  /**
   * Specify how to read a flow's target.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let target;

  /**
   * Specify how to read a flow's value. Flows that are not positive are
   * left out.
   * @type {import("../utils/accessor.js").Accessor<T, number | null | undefined>}
   */
  export let value;

  /**
   * Specify the nodes in order around the circle. Defaults to the order
   * first seen in the flows.
   * @type {ReadonlyArray<string | number>}
   */
  export let nodes = undefined;

  /**
   * Specify the node order: as given, or largest first.
   * @type {"none" | "value"}
   */
  export let sort = "none";

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Specify the diameter of the circle, in pixels. It scales down with its container. */
  export let diameter = 360;

  /** Specify the depth of the group arcs, in pixels */
  export let thickness = 12;

  /** Specify the room around the circle for labels, in pixels */
  export let labelSpace = 88;

  /**
   * Specify how values are written: `Intl.NumberFormat` options or a function.
   * @type {import("../utils/format-compact.js").NumberFormat}
   */
  export let format = undefined;

  /**
   * Specify a fixed color per node.
   * @type {Record<string, import("../utils/tokens.js").VizColor>}
   */
  export let colors = {};

  /**
   * Specify which of Carbon's prescribed color groups to use (1-based).
   */
  export let palette = 1;

  /**
   * Specify the selected node, as its key.
   * @type {string | null}
   */
  export let selected = null;

  /**
   * Override the words used for assistive technology.
   * @type {{ from?: string; to?: string; out?: string; in?: string }}
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
  import ChartTooltipRow from "../Chart/ChartTooltipRow.svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { resolveFormat } from "../utils/format-compact.js";
  import { buildChord } from "./chord-geometry.js";

  const dispatch = createEventDispatcher();

  /** @type {{ kind: "group" | "ribbon"; index: number } | null} */
  let active = null;

  $: sourceOf = toAccessor(source);
  $: targetOf = toAccessor(target);
  $: valueOf = toAccessor(value);
  $: radius = diameter / 2;
  $: size = diameter + labelSpace * 2;
  // Depends on the data and the options only, so hover never lays out again.
  $: chord = buildChord(data, {
    source: sourceOf,
    target: targetOf,
    value: valueOf,
    nodes,
    radius,
    thickness,
    sort,
    palette,
    colors,
  });
  $: formatValue = resolveFormat(format, locale);
  $: text = { from: "From", to: "to", out: "out", in: "in", ...words };
  $: groupIndex = new Map(chord.groups.map((group, i) => [group.key, i]));
  $: activeKeys =
    active === null
      ? null
      : active.kind === "group"
        ? new Set([chord.groups[active.index].key])
        : new Set([
            chord.ribbons[active.index].source,
            chord.ribbons[active.index].target,
          ]);
  $: announcement = active === null ? "" : describeActive(active);
  $: anchor =
    active === null
      ? null
      : active.kind === "group"
        ? {
            x: chord.groups[active.index].labelX,
            y: chord.groups[active.index].labelY,
            color: chord.groups[active.index].color,
          }
        : { x: 0, y: 0, color: chord.ribbons[active.index].color };

  /** @param {{ kind: "group" | "ribbon"; index: number }} at */
  function describeActive(at) {
    if (at.kind === "group") {
      const group = chord.groups[at.index];
      return `${group.key}: ${formatValue(group.out)} ${text.out}, ${formatValue(group.in)} ${text.in}`;
    }
    const link = chord.ribbons[at.index];
    if (link.source === link.target) {
      return `${link.source} → ${link.target}: ${formatValue(link.forward)}`;
    }
    return `${link.source} → ${link.target}: ${formatValue(link.forward)}${
      link.backward > 0
        ? `, ${link.target} → ${link.source}: ${formatValue(link.backward)}`
        : ""
    }`;
  }

  /** @param {import("./chord-geometry.js").ChordRibbon<T>} link */
  function ribbonDetail(link) {
    return {
      source: link.source,
      target: link.target,
      forward: link.forward,
      backward: link.backward,
      value: link.value,
      rows: link.rows,
    };
  }

  /** @param {{ kind: "group" | "ribbon"; index: number } | null} next */
  function setActive(next) {
    if (
      (next === null && active === null) ||
      (next &&
        active &&
        next.kind === active.kind &&
        next.index === active.index)
    ) {
      return;
    }
    active = next;
    if (next === null) {
      dispatch("hover", null);
    } else if (next.kind === "group") {
      const group = chord.groups[next.index];
      dispatch("hover", {
        kind: "group",
        key: group.key,
        out: group.out,
        in: group.in,
        total: group.total,
      });
    } else {
      dispatch("hover", {
        kind: "ribbon",
        ...ribbonDetail(chord.ribbons[next.index]),
      });
    }
  }

  /**
   * @param {number} index
   * @param {Event} originalEvent
   */
  function selectGroup(index, originalEvent) {
    setActive({ kind: "group", index });
    const group = chord.groups[index];
    selected = selected === group.key ? null : group.key;
    dispatch("select", {
      key: group.key,
      out: group.out,
      in: group.in,
      total: group.total,
      ribbons: chord.ribbons
        .filter(
          (link) => link.source === group.key || link.target === group.key,
        )
        .map(ribbonDetail),
      originalEvent,
    });
  }

  /**
   * Right and Left walk the groups around the circle, Enter selects.
   * @param {KeyboardEvent} event
   */
  function onKeydown(event) {
    const last = chord.groups.length - 1;
    if (last < 0) return;
    const at = active?.kind === "group" ? active.index : -1;
    let next = at;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = Math.min(last, at + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = Math.max(0, at - 1);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (at >= 0) selectGroup(at, event);
        return;
      case "Escape":
        setActive(null);
        return;
      default:
        return;
    }
    event.preventDefault();
    setActive({ kind: "group", index: next });
  }

  /** @param {import("./chord-geometry.js").ChordGroup} group */
  function labelTransform(group) {
    const degrees = (group.labelAngle * 180) / Math.PI - 90;
    return `rotate(${degrees}) translate(${radius + 8} 0)${group.flip ? " rotate(180)" : ""}`;
  }
</script>

<figure
  bind:this={ref}
  class:bx--viz-chord={true}
  class:bx--viz-chord--emphasis={active !== null}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <div class:bx--viz-chord__plot={true} style:max-width="{size}px">
    <!-- A chart is one tab stop. Arrow keys walk the groups around the circle. -->
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <svg
      class:bx--viz-chord__svg={true}
      viewBox="{-size / 2} {-size / 2} {size} {size}"
      role="application"
      aria-roledescription="chart"
      aria-label={title || undefined}
      tabindex="0"
      on:keydown={onKeydown}
      on:pointerleave={() => setActive(null)}
      on:blur={() => setActive(null)}
    >
      <g aria-hidden="true">
        {#each chord.ribbons as link, i (link.id)}
          <!-- svelte-ignore a11y-mouse-events-have-key-events -->
          <path
            class:bx--viz-chord__ribbon={true}
            class:bx--viz-chord__ribbon--active={(activeKeys?.has(
              link.source,
            ) ||
              activeKeys?.has(link.target)) ??
              false}
            style:--bx-viz-color={link.color}
            d={link.d}
            on:mouseenter={() => setActive({ kind: "ribbon", index: i })}
          />
        {/each}
        {#each chord.groups as group, i (group.key)}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-mouse-events-have-key-events -->
          <g
            class:bx--viz-chord__group={true}
            class:bx--viz-chord__group--active={activeKeys?.has(group.key) ??
              false}
            class:bx--viz-chord__group--selected={group.key === selected}
            style:--bx-viz-color={group.color}
            on:click={(event) => selectGroup(i, event)}
            on:mouseenter={() => setActive({ kind: "group", index: i })}
          >
            <path class:bx--viz-chord__arc={true} d={group.d} />
            <text
              class:bx--viz-chord__label={true}
              transform={labelTransform(group)}
              dy="0.32em"
              text-anchor={group.flip ? "end" : "start"}
            >
              {group.key}
            </text>
            <title>{describeActive({ kind: "group", index: i })}</title>
          </g>
        {/each}
      </g>
    </svg>
    {#if active !== null && anchor}
      <div
        class:bx--viz-chart-tooltip={true}
        class:bx--viz-chart-tooltip--flipped={anchor.x > 0}
        aria-hidden="true"
        style:left="{((anchor.x + size / 2) / size) * 100}%"
        style:top="{((anchor.y + size / 2) / size) * 100}%"
      >
        {#if active.kind === "group"}
          <ChartTooltipRow
            color={anchor.color}
            label={chord.groups[active.index].key}
            value="{formatValue(
              chord.groups[active.index].out,
            )} {text.out}, {formatValue(
              chord.groups[active.index].in,
            )} {text.in}"
          />
        {:else}
          {@const link = chord.ribbons[active.index]}
          <ChartTooltipRow
            color={link.color}
            label="{link.source} → {link.target}"
            value={formatValue(link.forward)}
          />
          {#if link.backward > 0}
            <ChartTooltipRow
              color={chord.groups[groupIndex.get(link.target) ?? 0]?.color}
              label="{link.target} → {link.source}"
              value={formatValue(link.backward)}
            />
          {/if}
        {/if}
      </div>
    {/if}
  </div>
  <!-- Every flow, for assistive technology: a row per source, a column
       per target. -->
  <table class:bx--visually-hidden={true}>
    {#if title}
      <caption>
        {title}
      </caption>
    {/if}
    <thead>
      <tr>
        <th scope="col">{text.from} \ {text.to}</th>
        {#each chord.groups as group (group.key)}
          <th scope="col">{group.key}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each chord.groups as from (from.key)}
        <tr>
          <th scope="row">{from.key}</th>
          {#each chord.groups as to (to.key)}
            {@const link = chord.ribbons.find(
              (entry) =>
                (entry.source === from.key && entry.target === to.key) ||
                (entry.source === to.key && entry.target === from.key),
            )}
            {@const amount = link
              ? link.source === from.key
                ? link.forward
                : link.backward
              : 0}
            <td>{amount > 0 ? formatValue(amount) : ""}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
</figure>
