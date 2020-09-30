<script>
  import { setContext } from "svelte";
  import { Form } from "../Form";

  setContext("Form", {
    isFluid: true,
  });
</script>

<Form class="bx--form--fluid" {...$$restProps}>
  <slot />
</Form>
