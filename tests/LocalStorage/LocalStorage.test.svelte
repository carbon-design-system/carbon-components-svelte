<svelte:options accessors />

<script lang="ts">
  import LocalStorage from "carbon-components-svelte/LocalStorage/LocalStorage.svelte";

  const primitiveValue = "test-value";
  const objectValue = { theme: "dark", fontSize: 16 };
</script>

<div data-testid="default-storage"><LocalStorage value={primitiveValue} /></div>

<div data-testid="storage-object">
  <LocalStorage key="theme-settings" value={objectValue} />
</div>
