<svelte:options accessors />

<script lang="ts">
  import type LocalStorageComponent from "carbon-components-svelte/LocalStorage/LocalStorage.svelte";
  import LocalStorage from "carbon-components-svelte/LocalStorage/LocalStorage.svelte";

  export let storage: LocalStorageComponent | undefined = undefined;
  export let programmaticValue: string | undefined = "programmatic-value";

  const primitiveValue = "test-value";
  const objectValue = { theme: "dark", fontSize: 16 };
</script>

<div data-testid="default-storage"><LocalStorage value={primitiveValue} /></div>

<div data-testid="storage-object">
  <LocalStorage key="theme-settings" value={objectValue} />
</div>

<LocalStorage
  bind:this={storage}
  key="programmatic-key"
  bind:value={programmaticValue}
/>
