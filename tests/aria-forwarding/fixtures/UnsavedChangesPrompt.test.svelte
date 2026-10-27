<script lang="ts">
  import UnsavedChangesPrompt from "carbon-components-svelte/UnsavedChanges/UnsavedChangesPrompt.svelte";
  import { createUnsavedChanges } from "carbon-components-svelte/UnsavedChanges/unsaved-changes.js";
  import { onMount } from "svelte";

  const store = createUnsavedChanges();
  store.set("form", true);

  // The prompt renders nothing until a guard asks.
  onMount(() => {
    store.guard();
  });
</script>

<UnsavedChangesPrompt {store} {...$$restProps} />
