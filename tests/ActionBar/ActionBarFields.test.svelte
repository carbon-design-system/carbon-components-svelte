<script lang="ts">
  import ActionBar from "carbon-components-svelte/ActionBar/ActionBar.svelte";
  import ActionBarItem from "carbon-components-svelte/ActionBar/ActionBarItem.svelte";
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";

  export let size: "xs" | "sm" | "md" | "lg" = "md";
</script>

<ActionBar labelText="Table tools" {size}>
  <ActionBarItem>
    <Dropdown
      hideLabel
      labelText="Style"
      selectedId="a"
      items={[{ id: "a", text: "Paragraph" }]}
    />
  </ActionBarItem>
  <ActionBarItem>
    <Search labelText="Find" />
  </ActionBarItem>
  <ActionBarItem>
    <TextInput hideLabel labelText="Page" />
  </ActionBarItem>
  <ActionBarItem>
    <Search labelText="Filter" size="xl" />
  </ActionBarItem>
</ActionBar>
