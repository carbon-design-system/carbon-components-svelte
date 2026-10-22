<svelte:options immutable />

<script>
  /**
   * @typedef {{ id?: string | number; value: number; label?: string }} WinLossResult
   */

  /**
   * @event {{ result: WinLossResult; index: number }} select Fires when a result is activated by click or keyboard. Requires `selectable`.
   */

  /** @restProps {div} */

  /**
   * Specify the results, oldest first: a number per result, or an object
   * with a `value` and a `label` naming it for assistive technology. A
   * positive value is a win, a negative one a loss, and zero a tie.
   * @type {ReadonlyArray<number | WinLossResult>}
   */
  export let data = [];

  /**
   * Specify the accessible name. The record is appended to it.
   * Leave empty to mark the graphic as decorative.
   */
  export let label = "";

  /** Set to `true` to write the record next to the marks */
  export let showValue = false;

  /**
   * Specify the size.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /** Set to `true` to make results selectable */
  export let selectable = false;

  /**
   * Specify the index of the selected result.
   * @type {number | undefined}
   */
  export let selectedIndex = undefined;

  /**
   * Override the words used for each outcome. The record reads
   * `8 wins, 3 losses, 1 tie`; the singular forms are used for one.
   * @type {{ win?: string; wins?: string; loss?: string; losses?: string; tie?: string; ties?: string }}
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

  const dispatch = createEventDispatcher();

  let focusedIndex = -1;

  $: words = {
    win: "win",
    wins: "wins",
    loss: "loss",
    losses: "losses",
    tie: "tie",
    ties: "ties",
    ...translations,
  };
  $: results = data.map((entry) =>
    typeof entry === "number" ? { value: entry } : entry,
  );
  $: outcomes = results.map((result) =>
    result.value > 0 ? "win" : result.value < 0 ? "loss" : "tie",
  );
  $: record = tally(outcomes);
  $: text = [
    `${record.win} ${record.win === 1 ? words.win : words.wins}`,
    `${record.loss} ${record.loss === 1 ? words.loss : words.losses}`,
    record.tie > 0
      ? `${record.tie} ${record.tie === 1 ? words.tie : words.ties}`
      : "",
  ]
    .filter(Boolean)
    .join(", ");
  $: short = [
    record.win,
    record.loss,
    ...(record.tie > 0 ? [record.tie] : []),
  ].join("–");
  $: name = [label, text].filter(Boolean).join(": ");
  $: tabStopIndex =
    focusedIndex >= 0 && focusedIndex < results.length
      ? focusedIndex
      : selectedIndex !== undefined && selectedIndex < results.length
        ? selectedIndex
        : Math.max(results.length - 1, 0);

  /** @param {ReadonlyArray<"win" | "loss" | "tie">} list */
  function tally(list) {
    const out = { win: 0, loss: 0, tie: 0 };
    for (const outcome of list) out[outcome]++;
    return out;
  }

  /**
   * Roving focus across the result buttons, attached only while
   * `selectable`, so a static row adds no listeners.
   *
   * @param {HTMLElement} node
   * @param {boolean} enabled
   */
  function rovingResults(node, enabled) {
    /** @type {ReturnType<typeof rovingFocus> | undefined} */
    let roving;
    /** @param {boolean} on */
    function sync(on) {
      if (on && !roving) {
        roving = rovingFocus(node, {
          selector: ".bx--viz-winloss__result",
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
   * @param {WinLossResult} result
   * @param {number} index
   */
  function select(result, index) {
    selectedIndex = index;
    focusedIndex = index;
    dispatch("select", { result, index });
  }
</script>

<div
  bind:this={ref}
  class:bx--viz-winloss={true}
  class:bx--viz-winloss--sm={size === "sm"}
  class:bx--viz-winloss--lg={size === "lg"}
  class:bx--viz-winloss--selectable={selectable}
  role={selectable ? "group" : label ? "img" : undefined}
  aria-label={selectable ? name || undefined : label ? name : undefined}
  aria-hidden={selectable || label ? undefined : "true"}
  {...$$restProps}
>
  <!-- A win rises from the middle, a loss drops from it, a tie is a dash
       on it: the outcome is in the position, not only the color. -->
  <span class:bx--viz-winloss__track={true} use:rovingResults={selectable}>
    {#each results as result, i (result.id ?? i)}
      {#if selectable}
        <button
          type="button"
          class="bx--viz-winloss__result bx--viz-winloss__result--{outcomes[i]}"
          class:bx--viz-winloss__result--selected={i === selectedIndex}
          tabindex={i === tabStopIndex ? 0 : -1}
          aria-pressed={i === selectedIndex}
          aria-label={[result.label, words[outcomes[i]]]
            .filter(Boolean)
            .join(": ")}
          on:click={() => select(result, i)}
          on:focus={() => (focusedIndex = i)}
        ></button>
      {:else}
        <span
          class="bx--viz-winloss__result bx--viz-winloss__result--{outcomes[i]}"
        ></span>
      {/if}
    {/each}
  </span>
  {#if showValue && results.length > 0}
    <span class:bx--viz-winloss__value={true}>{short}</span>
  {/if}
</div>
