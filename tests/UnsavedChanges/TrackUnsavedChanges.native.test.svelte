<script lang="ts">
  import { trackUnsavedChanges } from "carbon-components-svelte/UnsavedChanges/track-unsaved-changes.js";
  import type { UnsavedChangesStore } from "carbon-components-svelte/UnsavedChanges/unsaved-changes.js";

  export let store: UnsavedChangesStore;

  let name = "Ada";
  let agree = true;
  let color = "green";
</script>

<!-- The action sits on the form itself, so it runs while the bound values
  are still reaching the controls. -->
<form data-testid="form" use:trackUnsavedChanges={{ store }}>
  <input aria-label="Name" bind:value={name} />
  <input type="checkbox" aria-label="Agree" bind:checked={agree} />
  <select aria-label="Color" bind:value={color}>
    <option value="red">Red</option>
    <option value="green">Green</option>
  </select>
</form>
