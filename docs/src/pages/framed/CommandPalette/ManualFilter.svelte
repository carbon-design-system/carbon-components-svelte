<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteItem,
    InlineLoading,
  } from "carbon-components-svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";

  let open = false;
  let value = "";
  let loading = false;
  let results = [];

  const database = Array.from({ length: 40 }, (_, i) => ({
    id: `doc-${i + 1}`,
    text: `Document ${i + 1}`,
    description: "Last edited 2 days ago",
    icon: Document,
  }));

  $: search(value);

  let timeout;
  function search(query) {
    clearTimeout(timeout);
    if (query.trim() === "") {
      results = database.slice(0, 5);
      loading = false;
      return;
    }
    loading = true;
    timeout = setTimeout(() => {
      results = database.filter((item) =>
        item.text.toLowerCase().includes(query.toLowerCase()),
      );
      loading = false;
    }, 400);
  }
</script>

<Button on:click={() => (open = true)}>Open async palette</Button>

<CommandPalette
  bind:open
  bind:value
  {loading}
  shouldFilter={false}
  noResultsText="No results found"
  triggerKeys={[]}
>
  {#each results as item (item.id)}
    <CommandPaletteItem
      id={item.id}
      text={item.text}
      description={item.description}
      icon={item.icon}
    />
  {/each}
  <div slot="loading" style="display: flex; justify-content: center;">
    <InlineLoading description="Searching..." />
  </div>
</CommandPalette>
