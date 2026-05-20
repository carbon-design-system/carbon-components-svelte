<script>
  /**
   * @restProps {form}
   */

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
