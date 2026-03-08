<script>
  import { ContainedList, ContainedListItem } from "carbon-components-svelte";

  let clickedItem = null;
</script>

<div data-testid="contained-list">
  <ContainedList labelText="List title">
    <ContainedListItem interactive on:click={() => (clickedItem = "1")}>
      Item 1
    </ContainedListItem>
    <ContainedListItem interactive on:click={() => (clickedItem = "2")}>
      Item 2
    </ContainedListItem>
  </ContainedList>
</div>
<div data-testid="clicked-item">{clickedItem ?? "none"}</div>
