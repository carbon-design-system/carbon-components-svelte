<script>
  import {
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListInput,
    StructuredListRow,
  } from "carbon-components-svelte";

  const databases = [
    {
      id: "postgresql",
      name: "PostgreSQL",
      type: "Relational",
      version: "16.2",
    },
    {
      id: "mongodb",
      name: "MongoDB",
      type: "Document",
      version: "7.0",
    },
    {
      id: "redis",
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

  let sortKey = null;
  let sortDirection = "none";
  let selected = "postgresql-value";

  function handleSort(key, direction) {
    sortDirection = direction;
    sortKey = direction === "none" ? null : key;
  }

  $: sorted =
    sortKey === null
      ? databases
      : [...databases].sort((a, b) => {
          const result = a[sortKey].localeCompare(b[sortKey]);
          return sortDirection === "ascending" ? result : -result;
        });
</script>

<StructuredList selection bind:selected>
  <StructuredListHead>
    <StructuredListRow head>
      {#each columns as column}
        <StructuredListCell
          head
          sortable
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
      <StructuredListRow label for={db.id}>
        <StructuredListCell>{db.name}</StructuredListCell>
        <StructuredListCell>{db.type}</StructuredListCell>
        <StructuredListCell>{db.version}</StructuredListCell>
        <StructuredListInput
          id={db.id}
          value="{db.id}-value"
          title="{db.name} option"
          name="database"
        />
      </StructuredListRow>
    {/each}
  </StructuredListBody>
</StructuredList>
