<script lang="ts">
  import Slider from "carbon-components-svelte/Slider/Slider.svelte";

  export let value = 20;
  export let hideTextInput = false;
  export let readonly = false;
  export let name = "level";
  /** Renders the slider outside the form, associated via the `form` attribute. */
  export let form: string | undefined = undefined;
</script>

{#if form}
  <form id={form} data-testid="form"></form>
  <Slider
    bind:value
    {form}
    {hideTextInput}
    {readonly}
    {name}
    labelText="Level"
    min={0}
    max={100}
  />
{:else}
  <form data-testid="form">
    <Slider
      bind:value
      {hideTextInput}
      {readonly}
      {name}
      labelText="Level"
      min={0}
      max={100}
    />
  </form>
{/if}
<p data-testid="bound">{value}</p>
