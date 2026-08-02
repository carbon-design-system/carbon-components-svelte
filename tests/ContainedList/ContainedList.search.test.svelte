<script lang="ts">
  import ContainedList from "carbon-components-svelte/ContainedList/ContainedList.svelte";
  import ContainedListItem from "carbon-components-svelte/ContainedList/ContainedListItem.svelte";
  import Search from "carbon-components-svelte/Search/Search.svelte";

  export let expandable = false;
</script>

<ContainedList labelText="List title">
  <Search slot="search" {expandable} placeholder="Filter" />
  <ContainedListItem>Item 1</ContainedListItem>
  <ContainedListItem>Item 2</ContainedListItem>
  <ContainedListItem>Item 3</ContainedListItem>
</ContainedList>
