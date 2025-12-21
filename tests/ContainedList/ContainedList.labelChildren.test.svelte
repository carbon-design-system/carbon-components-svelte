<script lang="ts">
  import { ContainedList, ContainedListItem } from "carbon-components-svelte";
</script>

<ContainedList>
  <span slot="labelChildren">Custom Slot Label</span>
  <ContainedListItem>Item 1</ContainedListItem>
  <ContainedListItem>Item 2</ContainedListItem>
</ContainedList>

