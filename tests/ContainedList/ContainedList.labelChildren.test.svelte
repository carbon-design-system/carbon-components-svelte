<script lang="ts">
  import ContainedList from "carbon-components-svelte/ContainedList/ContainedList.svelte";
  import ContainedListItem from "carbon-components-svelte/ContainedList/ContainedListItem.svelte";

  export let hideLabel = false;
</script>

<ContainedList {hideLabel}>
  <span slot="labelChildren">Custom Slot Label</span>
  <ContainedListItem>Item 1</ContainedListItem>
  <ContainedListItem>Item 2</ContainedListItem>
</ContainedList>
