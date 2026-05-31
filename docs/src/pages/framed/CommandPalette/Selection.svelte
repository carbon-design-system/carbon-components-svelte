<script>
  import {
    Button,
    CommandPalette,
    CommandPaletteGroup,
    CommandPaletteItem,
  } from "carbon-components-svelte";

  let open = false;

  let themeItems = [
    { id: "theme-white", text: "White", selected: true },
    { id: "theme-g10", text: "Gray 10", selected: false },
    { id: "theme-g90", text: "Gray 90", selected: false },
    { id: "theme-g100", text: "Gray 100", selected: false },
  ];

  let editorItems = [
    { id: "line-numbers", text: "Show line numbers", selected: true },
    { id: "word-wrap", text: "Word wrap", selected: false },
  ];

  function onSelect(event) {
    const { value } = event.detail;
    if (value.startsWith("theme-")) {
      themeItems = themeItems.map((item) => ({
        ...item,
        selected: item.id === value,
      }));
    } else {
      editorItems = editorItems.map((item) =>
        item.id === value ? { ...item, selected: !item.selected } : item,
      );
    }
  }
</script>

<Button on:click={() => (open = true)}>Open selection palette</Button>

<CommandPalette
  bind:open
  preventCloseOnSelect
  triggerKeys={[]}
  on:select={onSelect}
>
  <CommandPaletteGroup label="Theme">
    {#each themeItems as item (item.id)}
      <CommandPaletteItem
        id={item.id}
        text={item.text}
        value={item.id}
        selectionMode="single"
        selected={item.selected}
      />
    {/each}
  </CommandPaletteGroup>
  <CommandPaletteGroup label="Editor">
    {#each editorItems as item (item.id)}
      <CommandPaletteItem
        id={item.id}
        text={item.text}
        value={item.id}
        selectionMode="multiple"
        selected={item.selected}
      />
    {/each}
  </CommandPaletteGroup>
</CommandPalette>
