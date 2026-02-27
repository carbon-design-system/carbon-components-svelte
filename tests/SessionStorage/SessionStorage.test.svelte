<svelte:options accessors />

<script lang="ts">
  import { SessionStorage } from "carbon-components-svelte";

  // Example values for testing
  const primitiveValue = "test-value";
  const objectValue = { theme: "dark", fontSize: 16 };
</script>

<!-- Default session storage -->
<div data-testid="default-storage">
  <SessionStorage value={primitiveValue} />
</div>

<!-- Session storage with object value -->
<div data-testid="storage-object">
  <SessionStorage key="theme-settings" value={objectValue} />
</div>
