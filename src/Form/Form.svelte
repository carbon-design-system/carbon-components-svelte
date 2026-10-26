<script context="module">
  /**
   * @typedef {import("svelte/action").Action<HTMLFormElement, any>} FormAction
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

  /**
   * Set the size of every field in the form.
   * A field's own `size` takes precedence.
   * Also accepts Carbon v11's `"md"` (the 40px default) and `"lg"` (`"xl"`).
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  import { onMount, setContext } from "svelte";
  import { writable } from "svelte/store";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";
  import { FIELD_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";

  // Children get this library's names, so a field, button or search that
  // maps the form size never sees an alias.
  /** @type {import("svelte/store").Writable<undefined | "xs" | "sm" | "md" | "xl">} */
  const sharedSize = writable(normalizeSize(size, FIELD_SIZE_ALIASES));
  $: sharedSize.set(normalizeSize(size, FIELD_SIZE_ALIASES));

  setContext(FORM_SIZE_CONTEXT_KEY, sharedSize);

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
