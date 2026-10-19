<svelte:options accessors />

<script lang="ts">
  import ClickableTile from "carbon-components-svelte/Tile/ClickableTile.svelte";
  import type { ComponentProps } from "svelte";

  export let ref: ComponentProps<ClickableTile>["ref"] = undefined;
  export let onClick: (e: MouseEvent) => void = () => {};
</script>

<ClickableTile href="https://www.carbondesignsystem.com/" bind:ref>
  Link only
</ClickableTile>

<ClickableTile
  href="https://www.carbondesignsystem.com/"
  title=""
  target="_blank"
>
  Link with other attributes
</ClickableTile>

<ClickableTile href="#" data-testid="click-test" on:click={onClick}>
  Click me
</ClickableTile>

<ClickableTile href="#" clicked>Clicked</ClickableTile>

<ClickableTile href="#" disabled data-testid="disabled-test">
  Disabled tile
</ClickableTile>
