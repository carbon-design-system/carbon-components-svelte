<script lang="ts">
  import CommandPalette from "carbon-components-svelte/CommandPalette/CommandPalette.svelte";
  import type { ComponentProps } from "svelte";

  type Props = ComponentProps<CommandPalette>;

  export let open = true;
  export let value = "";
  export let items: Props["items"] = [
    { id: "deploy", text: "Deploy service", shortcut: "mod+d" },
    { id: "logs", text: "View logs", keywords: ["tail", "events"] },
    {
      id: "env",
      text: "Edit environment",
      description: "Variables and secrets",
    },
    { id: "delete", text: "Delete service", disabled: true },
  ];
  export let shouldFilter = true;
  export let debounce = 0;
  export let loading = false;
  export let preventSelect = false;
  export let preventCloseOnClickOutside = false;
  export let virtualize: Props["virtualize"] = undefined;

  let selected = "";
  let closedBy = "";
  let searched = "";
</script>

<button type="button" data-testid="trigger" on:click={() => (open = true)}>
  Open
</button>
<CommandPalette
  bind:open
  bind:value
  {items}
  {shouldFilter}
  {debounce}
  {loading}
  {preventCloseOnClickOutside}
  {virtualize}
  on:select={(event) => {
    selected = String(event.detail.item.id);
    if (preventSelect) event.preventDefault();
  }}
  on:close={(event) => (closedBy = event.detail.trigger)}
  on:search={(event) => (searched = event.detail)}
/>
<span data-testid="selected">{selected}</span>
<span data-testid="closed-by">{closedBy}</span>
<span data-testid="searched">{searched}</span>
<span data-testid="open">{open}</span>
