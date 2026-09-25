<script context="module">
  /**
   * @typedef {import("svelte/action").Action<
   *   HTMLFormElement,
   *   any
   * >} FormAction
   * @typedef {FormAction | [FormAction, any]} FormActionEntry
   */

  /**
   * @param {HTMLFormElement} node
   * @param {ReadonlyArray<FormActionEntry>} entries
   * @returns {() => void}
   */
  function applyActions(node, entries) {
    /** @type {Array<() => void>} */
    const destroyers = [];

    for (const entry of entries) {
      const isTuple = Array.isArray(entry);
      const action = isTuple ? entry[0] : entry;
      const result = isTuple ? action(node, entry[1]) : action(node);

      if (result && typeof result.destroy === "function") {
        destroyers.push(result.destroy);
      }
    }

    return () => {
      for (const destroy of destroyers) {
        destroy();
      }
    };
  }
</script>

<script>
  /**
   * @restProps {form}
   * @typedef {import("svelte/action").Action<
   *   HTMLFormElement,
   *   any
   * >} FormAction
   * @typedef {FormAction | [FormAction, any]} FormActionEntry
   */

  /**
   * Obtain a reference to the form element.
   * @type {null | HTMLFormElement}
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Apply Svelte actions to the underlying form element.
   * Each entry is an action or a `[action, parameter]` tuple.
   * Use this for SvelteKit's `enhance` and other form actions that
   * cannot target components with `use:`.
   * @type {ReadonlyArray<FormActionEntry>}
   */
  export let actions = [];

  import { onMount } from "svelte";

  onMount(() => {
    if (!ref || actions.length === 0) return;
    return applyActions(ref, actions);
  });
</script>

<form
  class:bx--form={true}
  bind:this={ref}
  {...$$restProps}
  on:click
  on:keydown
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:submit
  on:reset
>
  <slot />
</form>
