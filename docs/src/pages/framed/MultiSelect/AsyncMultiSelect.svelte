<script>
  import { MultiSelect } from "carbon-components-svelte";
  import { onMount } from "svelte";

  let items = [];
  let selected = [];
  let loading = false;
  let timeoutId;
  let inputValue = "";

  // Simulate a server that filters by the query.
  async function fetchItems(query) {
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

  // Keep the selected options in `items`, so their tags survive a search.
  function withSelected(results) {
    const selectedIds = new Set(selected.map((item) => item.id));
    return [
      ...selected,
      ...results.filter((item) => !selectedIds.has(item.id)),
    ];
  }

  onMount(() => () => clearTimeout(timeoutId));

  $: {
    clearTimeout(timeoutId);
    // Debounce input value changes.
    timeoutId = setTimeout(async () => {
      const query = inputValue;
      loading = true;
      const results = await fetchItems(query);
      // A newer search has started; let it report instead.
      if (query !== inputValue) return;
      items = withSelected(results);
      loading = false;
    }, 150);
  }
</script>

<MultiSelect
  filterable
  filterItem={() => true}
  labelText="Alert channels"
  placeholder="Type to search..."
  bind:value={inputValue}
  {items}
  {loading}
  emptyText={(value) => `No channels match "${value}"`}
  on:select={(e) => (selected = e.detail.selected)}
/>
