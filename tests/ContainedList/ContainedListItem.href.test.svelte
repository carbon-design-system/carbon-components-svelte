<script lang="ts">
  import ContainedList from "carbon-components-svelte/ContainedList/ContainedList.svelte";
  import ContainedListItem from "carbon-components-svelte/ContainedList/ContainedListItem.svelte";

  export let onclick: (() => void) | undefined = undefined;

  function handleClick(event: MouseEvent) {
    event.preventDefault();
    onclick?.();
  }
</script>

<ContainedList labelText="Related resources">
  <ContainedListItem href="/docs" on:click={handleClick}>
    Documentation
  </ContainedListItem>
  <ContainedListItem href="/docs" interactive on:click={handleClick}>
    Prefer href
  </ContainedListItem>
  <ContainedListItem href="/docs" disabled on:click={() => onclick?.()}>
    Disabled
  </ContainedListItem>
  <ContainedListItem href="https://example.com" target="_blank">
    External
  </ContainedListItem>
  <ContainedListItem interactive on:click={() => onclick?.()}>
    Interactive
  </ContainedListItem>
  <ContainedListItem>Static</ContainedListItem>
</ContainedList>
