<svelte:options accessors />

<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import FluidForm from "carbon-components-svelte/FluidForm/FluidForm.svelte";

  export let preventDefault = false;
  export let ref: null | HTMLFormElement = null;

  let className: undefined | string = undefined;

  export { className as class };
</script>

<FluidForm
  bind:ref
  class={className}
  data-testid="fluid-form"
  on:submit={(e) => {
    if (preventDefault) {
      e.preventDefault();
    }
    console.log("submit", e);
  }}
  on:reset={(e) => {
    console.log("reset", e);
  }}
>
  <Button type="submit">Submit</Button>
  <Button type="reset" kind="secondary">Reset</Button>
</FluidForm>
