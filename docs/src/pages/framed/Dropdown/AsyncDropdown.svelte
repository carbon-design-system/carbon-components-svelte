<script>
  import { Dropdown, InlineLoading } from "carbon-components-svelte";

  let items = [];
  let open = false;
  let status = "idle";
  let selectedId;
  let wasOpen = false;

  const allItems = [
    { id: "0", text: "Slack" },
    { id: "1", text: "Email" },
    { id: "2", text: "Fax" },
    { id: "3", text: "Phone" },
    { id: "4", text: "SMS" },
  ];

  async function fetchItems() {
    status = "loading";
    items = [];
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      items = allItems;
      status = items.length ? "idle" : "empty";
    } catch {
      status = "error";
    }
  }

  $: {
    if (open && !wasOpen) {
      fetchItems();
    }
    wasOpen = open;
  }
</script>

<Dropdown
  bind:open
  bind:selectedId
  labelText="Contact"
  label="Choose a contact method"
  {items}
>
  <svelte:fragment slot="empty">
    {#if status === "loading"}
      <InlineLoading status="active" description="Loading…" />
    {:else if status === "error"}
      Something went wrong
    {:else}
      No options
    {/if}
  </svelte:fragment>
</Dropdown>
