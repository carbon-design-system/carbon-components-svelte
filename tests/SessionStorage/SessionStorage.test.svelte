<svelte:options accessors />

<script lang="ts">
  import type SessionStorageComponent from "carbon-components-svelte/SessionStorage/SessionStorage.svelte";
  import SessionStorage from "carbon-components-svelte/SessionStorage/SessionStorage.svelte";

  export let storage: SessionStorageComponent | undefined = undefined;
  export let programmaticValue: string | undefined = "programmatic-value";

  const primitiveValue = "test-value";
  const objectValue = { theme: "dark", fontSize: 16 };
</script>

<div data-testid="default-storage">
  <SessionStorage value={primitiveValue} />
</div>

<div data-testid="storage-object">
  <SessionStorage key="theme-settings" value={objectValue} />
</div>

<SessionStorage
  bind:this={storage}
  key="programmatic-key"
  bind:value={programmaticValue}
/>
