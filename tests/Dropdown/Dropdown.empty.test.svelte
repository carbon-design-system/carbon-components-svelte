<script lang="ts">
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<Dropdown>["items"] = [];
  export let open = false;
  export let emptyContent: "custom" | "loading" | "error" = "custom";
</script>

<Dropdown {items} {open} labelText="Contact" label="Choose a contact method">
  <svelte:fragment slot="empty">
    {#if emptyContent === "loading"}
      <span data-testid="empty-loading">Loading…</span>
    {:else if emptyContent === "error"}
      <span data-testid="empty-error">Something went wrong</span>
    {:else}
      <span data-testid="empty-custom">Custom empty</span>
    {/if}
  </svelte:fragment>
</Dropdown>
