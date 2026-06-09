<svelte:options accessors />

<script lang="ts">
  import SessionStorage from "carbon-components-svelte/SessionStorage/SessionStorage.svelte";

  export let value: { theme: string; fontSize: number } = {
    theme: "dark",
    fontSize: 16,
  };
</script>

<div data-testid="object-storage">
  <SessionStorage key="theme-settings" bind:value />
</div>
