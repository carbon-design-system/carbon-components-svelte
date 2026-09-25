<svelte:options accessors />

<script lang="ts">
  import SessionStorage from "carbon-components-svelte/SessionStorage/SessionStorage.svelte";

  const primitiveValue = "test-value";
  const objectValue = { theme: "dark", fontSize: 16 };
</script>

<div data-testid="default-storage">
  <SessionStorage value={primitiveValue} />
</div>

<div data-testid="storage-object">
  <SessionStorage key="theme-settings" value={objectValue} />
</div>
