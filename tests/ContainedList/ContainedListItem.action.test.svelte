<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import ContainedList from "carbon-components-svelte/ContainedList/ContainedList.svelte";
  import ContainedListItem from "carbon-components-svelte/ContainedList/ContainedListItem.svelte";
  import Close from "carbon-icons-svelte/lib/Close.svelte";

  export let onItemClick: (() => void) | undefined = undefined;
  export let onActionClick: (() => void) | undefined = undefined;
</script>

<ContainedList labelText="List title">
  <ContainedListItem interactive on:click={() => onItemClick?.()}>
    Item 1
    <Button
      slot="action"
      kind="ghost"
      icon={Close}
      iconDescription="Dismiss"
      on:click={() => onActionClick?.()}
    />
  </ContainedListItem>
  <ContainedListItem>Item 2</ContainedListItem>
</ContainedList>
