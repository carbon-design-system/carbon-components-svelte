<script lang="ts">
  import FluidForm from "carbon-components-svelte/FluidForm/FluidForm.svelte";
  import type { Action } from "svelte/action";

  export let actions: Array<
    | Action<HTMLFormElement, unknown>
    | [Action<HTMLFormElement, unknown>, unknown]
  > = [];
  export let ref: null | HTMLFormElement = null;
</script>

<FluidForm bind:ref data-testid="fluid-form" {actions}>
  <button type="submit">Submit</button>
</FluidForm>
