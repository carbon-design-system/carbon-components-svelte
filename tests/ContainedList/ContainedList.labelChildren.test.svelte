<script lang="ts">
  import ContainedList from "carbon-components-svelte/ContainedList/ContainedList.svelte";
  import ContainedListItem from "carbon-components-svelte/ContainedList/ContainedListItem.svelte";
</script>

<ContainedList>
  <span slot="labelChildren">Custom Slot Label</span>
  <ContainedListItem>Item 1</ContainedListItem>
  <ContainedListItem>Item 2</ContainedListItem>
</ContainedList>
