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

  const columns = [
    { key: "name", label: "Name" },
    { key: "type", label: "Type" },
    { key: "version", label: "Latest version" },
  ];

  let sortKey = "name";
  let sortDirection = "ascending";

  function handleSort(key, direction) {
    sortDirection = direction;
    sortKey = key;
  }

  $: sorted = [...databases].sort((a, b) => {
    const result = a[sortKey].localeCompare(b[sortKey]);
    return sortDirection === "ascending" ? result : -result;
  });
</script>

<StructuredList>
  <StructuredListHead>
    <StructuredListRow head>
      {#each columns as column}
        <StructuredListCell
          head
          sortable
          sortAlways
          active={sortKey === column.key}
          sortDirection={sortKey === column.key ? sortDirection : "none"}
          on:sort={(e) => handleSort(column.key, e.detail.direction)}
        >
          {column.label}
        </StructuredListCell>
      {/each}
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
