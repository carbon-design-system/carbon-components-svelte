<script>
  import {
    Button,
    ButtonSet,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";

  let value = "";
</script>

<Toolbar>
  <ToolbarContent>
    <ToolbarSearch bind:value placeholder="Search..." />
    <Button size="small">Create</Button>
  </ToolbarContent>
</Toolbar>

<div>
  <ButtonSet>
    <Button
      size="small"
      disabled={value === "products"}
      on:click={() => (value = "products")}
    >
      Set value
    </Button>
    <Button
      kind="ghost"
      size="small"
      disabled={value.length === 0}
      on:click={() => (value = "")}
    >
      Clear value
    </Button>
  </ButtonSet>
</div>

<div>Search value: {value}</div>

<style>
  div {
    margin-top: var(--cds-spacing-05);
  }
</style>
