<script lang="ts">
  import ContainedList from "carbon-components-svelte/ContainedList/ContainedList.svelte";
  import ContainedListItem from "carbon-components-svelte/ContainedList/ContainedListItem.svelte";

  const jobs = ["Build", "Test", "Deploy"];
  export let selected = "Test";
</script>

<ContainedList labelText="Jobs">
  {#each jobs as job (job)}
    <ContainedListItem
      interactive
      selected={job === selected}
      on:click={() => (selected = job)}
    >
      {job}
    </ContainedListItem>
  {/each}
  <ContainedListItem selected>Static</ContainedListItem>
  <ContainedListItem href="#docs" selected>Docs</ContainedListItem>
</ContainedList>
