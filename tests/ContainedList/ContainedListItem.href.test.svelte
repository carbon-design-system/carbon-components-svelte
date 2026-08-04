<script lang="ts">
  import ContainedList from "carbon-components-svelte/ContainedList/ContainedList.svelte";
  import ContainedListItem from "carbon-components-svelte/ContainedList/ContainedListItem.svelte";

  function handleClick(event: MouseEvent) {
    event.preventDefault();
    console.log("click");
  }
</script>

<ContainedList labelText="Related resources">
  <ContainedListItem href="/docs" on:click={handleClick}>
    Documentation
  </ContainedListItem>
  <ContainedListItem href="/docs" interactive on:click={handleClick}>
    Prefer href
  </ContainedListItem>
  <ContainedListItem interactive on:click={() => console.log("click")}>
    Interactive
  </ContainedListItem>
  <ContainedListItem>Static</ContainedListItem>
</ContainedList>
