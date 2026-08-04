<script>
  /**
   * @restProps {form}
   * @typedef {import("svelte/action").Action<HTMLFormElement, any>} FormAction
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

  import { setContext } from "svelte";
  import Form from "../Form/Form.svelte";

  /**
   * Context published under the key `"carbon:Form"` for descendant inputs.
   * Custom fluid-aware inputs can subscribe with:
   * `const ctx = getContext("carbon:Form");`
   * and read `ctx.isFluid` to adapt their rendering.
   * @type {{ isFluid: boolean }}
   */
  const formContext = { isFluid: true };

  setContext("carbon:Form", formContext);
</script>

<Form
  bind:ref
  {actions}
  {...$$restProps}
  class={["bx--form--fluid", $$restProps.class].filter(Boolean).join(" ")}
  on:click
  on:keydown
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:submit
>
  <slot />
</Form>
