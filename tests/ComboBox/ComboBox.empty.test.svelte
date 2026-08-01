<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<ComboBox>["items"] = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
  ];
  export let value = "";
  export let open = false;
  export let emptyContent: "custom" | "loading" | "error" = "custom";
</script>

<ComboBox
  {items}
  {value}
  {open}
  labelText="Contact"
  placeholder="Select contact method"
  shouldFilterItem={(item, filterValue) =>
    item.text.toLowerCase().includes(filterValue.toLowerCase())}
>
  <svelte:fragment slot="empty">
    {#if emptyContent === "loading"}
      <span data-testid="empty-loading">Searching…</span>
    {:else if emptyContent === "error"}
      <span data-testid="empty-error">Something went wrong</span>
    {:else}
      <span data-testid="empty-custom">Custom empty</span>
    {/if}
  </svelte:fragment>
</ComboBox>
