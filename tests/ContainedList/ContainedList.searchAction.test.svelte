<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import ContainedList from "carbon-components-svelte/ContainedList/ContainedList.svelte";
  import ContainedListItem from "carbon-components-svelte/ContainedList/ContainedListItem.svelte";
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import Close from "carbon-icons-svelte/lib/Close.svelte";
</script>

<ContainedList labelText="List title">
  <Button slot="action" kind="ghost" icon={Close} iconDescription="Action" />
  <Search slot="search" placeholder="Filter" />
  <ContainedListItem>Item 1</ContainedListItem>
  <ContainedListItem>Item 2</ContainedListItem>
  <ContainedListItem>Item 3</ContainedListItem>
</ContainedList>
