<svelte:options immutable />

<script>
  /**
   * @typedef {"ok" | "degraded" | "down" | "none"} UptimeStatus
   * @typedef {{ id?: string | number; status: UptimeStatus; label?: string }} UptimePeriod
   */

  /**
   * @event {{ period: UptimePeriod; index: number }} select Fires when a period is activated by click or keyboard. Requires `selectable`.
   */

  /** @restProps {div} */

  /**
   * Specify the periods, oldest first. `label` names a period for assistive
   * technology, such as its date.
   * @type {ReadonlyArray<UptimePeriod>}
   */
  export let data = [];

  /**
   * Specify the accessible name. The uptime is appended to it.
   * Leave empty to mark the graphic as decorative.
   */
  export let label = "";

  /** Set to `true` to write the uptime next to the bar */
  export let showValue = false;

  /** Specify the maximum number of fraction digits of the uptime */
  export let fractionDigits = 1;

  /**
   * Specify the size.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /** Set to `true` to make periods selectable */
  export let selectable = false;

  /**
   * Specify the index of the selected period.
   * @type {number | undefined}
   */
  export let selectedIndex = undefined;

  /**
   * Specify the locale.
   * @type {string}
   */
  export let locale = undefined;

  /**
   * Override the words used for each status and for the uptime.
   * @type {{ ok?: string; degraded?: string; down?: string; none?: string; uptime?: string }}
   */
  export let translations = {};

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import { rovingFocus } from "../../utils/roving-focus.js";
  import { formatPercent } from "../utils/format-compact.js";

  const dispatch = createEventDispatcher();

  let focusedIndex = -1;

  $: words = {
    ok: "Operational",
    degraded: "Degraded",
    down: "Down",
    none: "No data",
    uptime: "uptime",
    ...translations,
  };
  $: uptime = measure(data);
  $: text =
    uptime === null
      ? ""
      : `${formatPercent(uptime, { locale, digits: fractionDigits })} ${words.uptime}`;
  $: name = [label, text].filter(Boolean).join(": ");
  $: tabStopIndex =
    focusedIndex >= 0 && focusedIndex < data.length
      ? focusedIndex
      : selectedIndex !== undefined && selectedIndex < data.length
        ? selectedIndex
        : Math.max(data.length - 1, 0);

  /**
   * Share of the measured periods that were not down.
   * @param {ReadonlyArray<UptimePeriod>} periods
   */
  function measure(periods) {
    let measured = 0;
    let up = 0;
    for (const period of periods) {
      if (period.status === "none") continue;
      measured++;
      if (period.status !== "down") up++;
    }
    return measured > 0 ? up / measured : null;
  }

  /**
   * Roving focus across the period buttons, attached only while
   * `selectable`, so a static bar adds no listeners.
   *
   * @param {HTMLElement} node
   * @param {boolean} enabled
   */
  function rovingPeriods(node, enabled) {
    /** @type {ReturnType<typeof rovingFocus> | undefined} */
    let roving;
    /** @param {boolean} on */
    function sync(on) {
      if (on && !roving) {
        roving = rovingFocus(node, {
          selector: ".bx--viz-uptime__period",
          orientation: "horizontal",
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

  /**
   * @param {UptimePeriod} period
   * @param {number} index
   */
  function select(period, index) {
    selectedIndex = index;
    focusedIndex = index;
    dispatch("select", { period, index });
  }
</script>

<div
  bind:this={ref}
  class:bx--viz-uptime={true}
  class:bx--viz-uptime--sm={size === "sm"}
  class:bx--viz-uptime--lg={size === "lg"}
  class:bx--viz-uptime--selectable={selectable}
  role={selectable ? "group" : label ? "img" : undefined}
  aria-label={selectable ? name || undefined : label ? name : undefined}
  aria-hidden={selectable || label ? undefined : "true"}
  {...$$restProps}
>
  <span class:bx--viz-uptime__track={true} use:rovingPeriods={selectable}>
    {#each data as period, i (period.id ?? i)}
      {#if selectable}
        <button
          type="button"
          class="bx--viz-uptime__period bx--viz-uptime__period--{period.status}"
          class:bx--viz-uptime__period--selected={i === selectedIndex}
          tabindex={i === tabStopIndex ? 0 : -1}
          aria-pressed={i === selectedIndex}
          aria-label={[period.label, words[period.status]]
            .filter(Boolean)
            .join(": ")}
          on:click={() => select(period, i)}
          on:focus={() => (focusedIndex = i)}
        ></button>
      {:else}
        <span
          class="bx--viz-uptime__period bx--viz-uptime__period--{period.status}"
        ></span>
      {/if}
    {/each}
  </span>
  {#if showValue && text}
    <span class:bx--viz-uptime__value={true}>{text}</span>
  {/if}
</div>
