<script lang="ts">
  import UnsavedChangesPrompt from "carbon-components-svelte/UnsavedChanges/UnsavedChangesPrompt.svelte";
  import type { UnsavedChangesStore } from "carbon-components-svelte/UnsavedChanges/unsaved-changes.js";

  export let store: UnsavedChangesStore;
  export let copies = 1;
  export let title: string | undefined = undefined;
  export let confirmText: string | undefined = undefined;
  export let body: string | undefined = undefined;
</script>

{#each Array.from({ length: copies }) as _, index (index)}
  {#if body}
    <UnsavedChangesPrompt {store} {title} {confirmText}>
      {body}
    </UnsavedChangesPrompt>
  {:else}
    <UnsavedChangesPrompt {store} {title} {confirmText} />
  {/if}
{/each}
