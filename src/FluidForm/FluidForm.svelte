<script>
  /**
   * @restProps {form}
   */

  import { setContext } from "svelte";
  import Form from "../Form/Form.svelte";

  /**
   * Obtain a reference to the form element.
   * @type {null | HTMLFormElement}
   * @bindable readonly
   */
  export let ref = null;

  /**
   * @type {{ isFluid: boolean }}
   */
  const formContext = { isFluid: true };

  setContext("carbon:Form", formContext);
</script>

<Form
  bind:ref
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
