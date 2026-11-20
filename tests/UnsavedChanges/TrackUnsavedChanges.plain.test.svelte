<script lang="ts">
  import { trackUnsavedChanges } from "carbon-components-svelte/UnsavedChanges/track-unsaved-changes.js";
  import type { UnsavedChangesStore } from "carbon-components-svelte/UnsavedChanges/unsaved-changes.js";

  export let store: UnsavedChangesStore;
  export let dirty: boolean | undefined = undefined;
</script>

<div data-testid="box" use:trackUnsavedChanges={{ store, dirty }}>
  <input aria-label="Plain" value="a" />
</div>
