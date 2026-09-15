<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import ContainedList from "carbon-components-svelte/ContainedList/ContainedList.svelte";
  import ContainedListItem from "carbon-components-svelte/ContainedList/ContainedListItem.svelte";
  import Close from "carbon-icons-svelte/lib/Close.svelte";
</script>

<ContainedList labelText="List title" hideLabel>
  <Button slot="action" kind="ghost" icon={Close} iconDescription="Action" />
  <ContainedListItem>Item 1</ContainedListItem>
</ContainedList>
