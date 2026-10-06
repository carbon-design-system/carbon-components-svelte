<script lang="ts">
  import ClickableTile from "carbon-components-svelte/Tile/ClickableTile.svelte";

  export let onClick: (e: MouseEvent) => void = () => {};
</script>

<ClickableTile on:click={onClick}>Acknowledge incident</ClickableTile>

<ClickableTile disabled data-testid="disabled"
  >Disabled without href</ClickableTile
>

<ClickableTile tabindex={-1} data-testid="custom-tabindex">
  Custom tabindex
</ClickableTile>
