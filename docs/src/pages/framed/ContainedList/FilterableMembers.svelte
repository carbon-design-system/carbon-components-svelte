<script>
  import {
    ContainedList,
    ContainedListItem,
    Search,
  } from "carbon-components-svelte";

  const members = [
    "Amelia Chen",
    "Diego Morales",
    "Harper Patel",
    "Jordan Lee",
    "Maya Okonkwo",
    "Noah Bergman",
    "Priya Shah",
    "Samir Haddad",
  ];

  let searchTerm = "";

  $: filteredMembers = members.filter((member) =>
    member.toLowerCase().includes(searchTerm.toLowerCase()),
  );
</script>

<ContainedList labelText="Team members">
  <Search slot="search" placeholder="Filter members" bind:value={searchTerm} />
  {#each filteredMembers as member (member)}
    <ContainedListItem>{member}</ContainedListItem>
  {/each}
</ContainedList>
