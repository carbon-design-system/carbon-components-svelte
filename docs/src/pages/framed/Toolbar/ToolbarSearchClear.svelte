<script>
  import {
    Button,
    Stack,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  let toolbarSearch;
  let value = "";
</script>

<Stack gap={6}>
  <Toolbar>
    <ToolbarContent>
      <ToolbarSearch
        bind:this={toolbarSearch}
        bind:value
        persistent
        placeholder="Search..."
      />
      <Button
        kind="ghost"
        size="small"
        disabled={value.length === 0}
        on:click={() => toolbarSearch.clear()}
      >
        Clear search
      </Button>
    </ToolbarContent>
  </Toolbar>
  <div>
    <strong>Search value:</strong>
    {value}
  </div>
</Stack>
