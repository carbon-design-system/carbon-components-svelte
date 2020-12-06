<script>
  import { setContext } from "svelte";
  import Form from "../Form/Form.svelte";

  setContext("Form", { isFluid: true });
</script>

<Form {...$$restProps} class="bx--form--fluid {$$restProps.class}">
  <slot />
</Form>
