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
</script>

<Button on:click={() => (open = true)}>Open selection palette</Button>

<CommandPalette bind:open preventCloseOnSelect triggerKeys={[]}>
  <CommandPaletteGroup label="Theme">
    {#each themeItems as item (item.id)}
      <CommandPaletteItem
        id={item.id}
        text={item.text}
        value={item.id}
        selectionMode="single"
        selected={item.selected}
        on:select={() => {
          themeItems = themeItems.map((themeItem) => ({
            ...themeItem,
            selected: themeItem.id === item.id,
          }));
        }}
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
        on:select={() => {
          editorItems = editorItems.map((editorItem) =>
            editorItem.id === item.id
              ? { ...editorItem, selected: !editorItem.selected }
              : editorItem,
          );
        }}
      />
    {/each}
  </CommandPaletteGroup>
</CommandPalette>
