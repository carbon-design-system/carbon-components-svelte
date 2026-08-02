<svelte:options accessors />

<script lang="ts">
  import Form from "carbon-components-svelte/Form/Form.svelte";
  import type { Action } from "svelte/action";

  export let actions: Array<
    | Action<HTMLFormElement, unknown>
    | [Action<HTMLFormElement, unknown>, unknown]
  > = [];
  export let ref: null | HTMLFormElement = null;
</script>

<Form bind:ref data-testid="form" {actions}>
  <button type="submit">Submit</button>
</Form>
