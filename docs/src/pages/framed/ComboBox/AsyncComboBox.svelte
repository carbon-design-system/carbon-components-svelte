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
      { id: "2", text: "Fax" },
      { id: "3", text: "Phone" },
      { id: "4", text: "SMS" },
      { id: "5", text: "WhatsApp" },
      { id: "6", text: "Teams" },
      { id: "7", text: "Discord" },
      { id: "8", text: "Zoom" },
      { id: "9", text: "Skype" },
    ];

    return allItems.filter((item) =>
      item.text.toLowerCase().includes(query.toLowerCase()),
    );
  }

  onMount(() => {
    // Fetch initial items.
    fetchItems("").then((data) => (items = data));

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
  labelText="Contact"
  placeholder="Type to search..."
  bind:value={inputValue}
  {items}
/>
