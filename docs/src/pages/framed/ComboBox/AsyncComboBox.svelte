<script>
  import { ComboBox } from "carbon-components-svelte";
  import { onMount } from "svelte";

  let items = [];
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

  onMount(() => {
    // Fetch initial items.
    fetchItems("")
      .then((data) => {
        items = data;
      })
      .catch(() => {});

    return () => {
      clearTimeout(timeoutId);
    };
  });

  $: {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      items = await fetchItems(inputValue);
      // Debounce input value changes.
    }, 150);
  }
</script>

<ComboBox
  labelText="Alert channel"
  placeholder="Type to search..."
  bind:value={inputValue}
  {items}
/>
