<script>
  import {
    ActionBar,
    ActionBarButton,
    ActionBarItem,
    Dropdown,
    Search,
    TextInput,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";

  let dropdownId = "a";
  let query = "";
</script>

<div id="fields" style="width: 720px">
  <ActionBar labelText="Table tools">
    <ActionBarButton labelText="Add row" icon={Add} />
    <ActionBarItem>
      <Dropdown
        size="sm"
        hideLabel
        labelText="Style"
        bind:selectedId={dropdownId}
        items={[
          { id: "a", text: "Paragraph" },
          { id: "b", text: "Heading" },
        ]}
      />
    </ActionBarItem>
    <ActionBarItem>
      <Search
        size="sm"
        labelText="Find"
        placeholder="Find"
        bind:value={query}
      />
    </ActionBarItem>
    <ActionBarItem>
      <TextInput size="sm" hideLabel labelText="Page" value="3" />
    </ActionBarItem>
    <ActionBarButton labelText="Copy" icon={Copy} />
  </ActionBar>
</div>

<!-- Safari tabs to a button only with an explicit tabindex. -->
<button type="button" id="after" tabindex="0">After</button>
