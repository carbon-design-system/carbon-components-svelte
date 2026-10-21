<svelte:options accessors />

<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import FluidForm from "carbon-components-svelte/FluidForm/FluidForm.svelte";

  export let preventDefault = false;
  export let ref: null | HTMLFormElement = null;
  export let onsubmit: (e: Event) => void = () => {};
  export let onreset: (e: Event) => void = () => {};

  let className: undefined | string = undefined;

  export { className as class };
</script>

<FluidForm
  bind:ref
  class={className}
  data-testid="form"
  on:submit={(e) => {
    if (preventDefault) {
      e.preventDefault();
    }
    onsubmit(e);
  }}
  on:reset={(e) => {
    onreset(e);
  }}
>
  <Button type="submit">Submit</Button>
  <Button type="reset" kind="secondary">Reset</Button>
</FluidForm>
