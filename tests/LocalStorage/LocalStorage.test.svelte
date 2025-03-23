<svelte:options accessors />

<script lang="ts">
import { LocalStorage } from "carbon-components-svelte";

// Example values for testing
const primitiveValue = "test-value";
const objectValue = { theme: "dark", fontSize: 16 };
</script>

<!-- Default local storage -->
<div data-testid="default-storage">
  <LocalStorage value={primitiveValue} />
</div>

<!-- Local storage with object value -->
<div data-testid="storage-object">
  <LocalStorage key="theme-settings" value={objectValue} />
</div>
