<script>
  import { setContext } from "svelte";
  import Form from "../Form/Form.svelte";

  setContext("Form", { isFluid: true });
</script>

<Form
  {...$$restProps}
  class="bx--form--fluid {$$restProps.class}"
  on:click
  on:keydown
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:submit
>
  <slot />
</Form>
