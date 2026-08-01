<script>
  import { ComboBox, InlineLoading } from "carbon-components-svelte";

  let items = [];
  let status = "idle";
  let timeoutId;
  let inputValue = "";

  // Simulate fetching data from a remote server.
  async function fetchItems(query) {
    if (!query) {
      return [];
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    const allItems = [
      { id: "0", text: "Slack" },
      { id: "1", text: "Email" },
      { id: "2", text: "PagerDuty" },
      { id: "3", text: "Webhook" },
      { id: "4", text: "Microsoft Teams" },
      { id: "5", text: "SMS" },
      { id: "6", text: "Opsgenie" },
      { id: "7", text: "ServiceNow" },
      { id: "8", text: "VictorOps" },
      { id: "9", text: "Zoom" },
    ];

    return allItems.filter((item) =>
      item.text.toLowerCase().includes(query.toLowerCase()),
    );
  }

  function handleInput() {
    clearTimeout(timeoutId);
    status = "loading";
    items = [];

    timeoutId = setTimeout(async () => {
      try {
        items = await fetchItems(inputValue);
        status = items.length ? "idle" : "empty";
      } catch {
        status = "error";
      }
    }, 150);
  }
</script>

<ComboBox
  labelText="Alert channel"
  placeholder="Type to search..."
  bind:value={inputValue}
  {items}
  on:input={handleInput}
>
  <svelte:fragment slot="empty">
    {#if status === "loading"}
      <InlineLoading status="active" description="Searching channels…" />
    {:else if status === "error"}
      Something went wrong
    {:else}
      No matching channels
    {/if}
  </svelte:fragment>
</ComboBox>
