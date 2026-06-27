<script lang="ts">
  import CommandPalette from "carbon-components-svelte/CommandPalette/CommandPalette.svelte";
  import CommandPaletteItem from "carbon-components-svelte/CommandPalette/CommandPaletteItem.svelte";

  export let open = false;
  export let value = "";
  export let shouldFilter = true;
  export let loading = false;
  export let size: "sm" | "lg" | "xl" | undefined = undefined;
  export let selected = "";
  export let closeTrigger = "";

  const items = [
    { id: "1", text: "Go to Dashboard" },
    { id: "2", text: "Open settings" },
    { id: "3", text: "Create document" },
    { id: "4", text: "Data Store for Memcache" },
  ];
</script>

<button type="button" on:click={() => (open = true)}>Open</button>

<CommandPalette
  bind:open
  bind:value
  {shouldFilter}
  {loading}
  {size}
  triggerKeys={[]}
  on:close={(e) => (closeTrigger = e.detail.trigger)}
>
  {#each items as item (item.id)}
    <CommandPaletteItem
      id={item.id}
      text={item.text}
      value={item.id}
      on:select={() => (selected = item.text)}
    />
  {/each}
</CommandPalette>

<div data-testid="result">{selected}</div>
<div data-testid="close">{closeTrigger}</div>
<div data-testid="query">{value}</div>
