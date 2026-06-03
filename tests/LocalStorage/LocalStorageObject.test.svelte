<svelte:options accessors />

<script lang="ts">
  import { LocalStorage } from "carbon-components-svelte";

  export let value: { theme: string; fontSize: number } = {
    theme: "dark",
    fontSize: 16,
  };
</script>

<div data-testid="object-storage">
  <LocalStorage key="theme-settings" bind:value />
</div>
