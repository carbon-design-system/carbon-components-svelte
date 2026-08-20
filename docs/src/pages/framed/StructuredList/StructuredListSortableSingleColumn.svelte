<script>
  import {
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow,
  } from "carbon-components-svelte";

  const databases = [
    {
      name: "PostgreSQL",
      type: "Relational",
      version: "16.2",
    },
    {
      name: "MongoDB",
      type: "Document",
      version: "7.0",
    },
    {
      name: "Redis",
      type: "Key-value",
      version: "7.2",
    },
  ];

  let sortDirection = "none";

  function handleSort(direction) {
    sortDirection = direction;
  }

  $: sorted =
    sortDirection === "none"
      ? databases
      : [...databases].sort((a, b) => {
          const result = a.name.localeCompare(b.name);
          return sortDirection === "ascending" ? result : -result;
        });
</script>

<StructuredList>
  <StructuredListHead>
    <StructuredListRow head>
      <StructuredListCell
        head
        sortable
        active={sortDirection !== "none"}
        {sortDirection}
        on:sort={(e) => handleSort(e.detail.direction)}
      >
        Name
      </StructuredListCell>
      <StructuredListCell head>Type</StructuredListCell>
      <StructuredListCell head>Latest version</StructuredListCell>
    </StructuredListRow>
  </StructuredListHead>
  <StructuredListBody>
    {#each sorted as db (db.name)}
      <StructuredListRow>
        <StructuredListCell>{db.name}</StructuredListCell>
        <StructuredListCell>{db.type}</StructuredListCell>
        <StructuredListCell>{db.version}</StructuredListCell>
      </StructuredListRow>
    {/each}
  </StructuredListBody>
</StructuredList>
