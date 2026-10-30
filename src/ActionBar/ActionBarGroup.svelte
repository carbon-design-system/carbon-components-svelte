<script>
  /**
   * Group related buttons. With `selection="single"` the buttons are the
   * radio buttons of one choice, such as an alignment.
   *
   * @event {{ value: string | number }} change - Dispatched when a button of a `selection="single"` group is chosen.
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * Specify the accessible name of the group.
   * @type {string | undefined}
   */
  export let labelText = undefined;

  /**
   * Specify how the buttons are chosen. `"single"` makes them radio buttons
   * with the `value` of the one pressed: the arrow keys of the bar move
   * focus between them as between any buttons, and Space or Enter chooses.
   * @type {"none" | "single"}
   */
  export let selection = "none";

  /**
   * Specify the `value` of the chosen button of a `selection="single"`
   * group.
   * @type {string | number | undefined}
   * @bindable writable
   */
  export let value = undefined;

  import { createEventDispatcher, getContext, setContext } from "svelte";
  import { readable, writable } from "svelte/store";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const bar = getContext("carbon:ActionBar");
  const hiddenGroups = bar?.hiddenGroups ?? readable(new Set());
  /** @type {string} */
  const id = uniqueId("ccs-action-bar-group");

  /** @type {import("svelte/store").Writable<"none" | "single">} */
  const sharedSelection = writable(selection);
  /** @type {import("svelte/store").Writable<string | number | undefined>} */
  const sharedValue = writable(value);
  /** @type {import("svelte/store").Writable<string | undefined>} */
  const sharedLabel = writable(labelText);
  $: sharedSelection.set(selection);
  $: sharedValue.set(value);
  $: sharedLabel.set(labelText);

  setContext("carbon:ActionBarGroup", {
    id,
    selection: sharedSelection,
    value: sharedValue,
    labelText: sharedLabel,
    /** @param {string | number} next */
    select(next) {
      if (value === next) return;
      value = next;
      dispatch("change", { value: next });
    },
  });
</script>

<div
  role={selection === "single" ? "radiogroup" : "group"}
  aria-label={labelText}
  {...$$restProps}
  class:bx--action-bar__group={true}
  class:bx--action-bar__group--collapsed={$hiddenGroups.has(id)}
>
  <slot />
</div>
