<svelte:options accessors />

<script lang="ts">
  import { ClickableTile } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let ref: ComponentProps<ClickableTile>["ref"] = undefined;
</script>

<ClickableTile href="https://www.carbondesignsystem.com/" bind:ref>
  Link only
</ClickableTile>

<ClickableTile
  light
  href="https://www.carbondesignsystem.com/"
  title=""
  target="_blank"
>
  Link with light variant
</ClickableTile>

<ClickableTile
  href="#"
  data-testid="click-test"
  on:click={() => {
    console.log("clicked");
  }}
>
  Click me
</ClickableTile>

<ClickableTile href="#" clicked>Clicked</ClickableTile>

<ClickableTile href="#" disabled data-testid="disabled-test">
  Disabled tile
</ClickableTile>
