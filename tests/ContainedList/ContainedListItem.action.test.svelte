<script lang="ts">
  import {
    Button,
    ContainedList,
    ContainedListItem,
  } from "carbon-components-svelte";
  import Close from "carbon-icons-svelte/lib/Close.svelte";
</script>

<ContainedList labelText="List title">
  <ContainedListItem interactive on:click={() => console.log("item click")}>
    Item 1
    <Button
      slot="action"
      kind="ghost"
      icon={Close}
      iconDescription="Dismiss"
      on:click={() => console.log("action click")}
    />
  </ContainedListItem>
  <ContainedListItem>Item 2</ContainedListItem>
</ContainedList>

