<script>
  import {
    Box,
    Button,
    DataTable,
    downloadFile,
    MenuButton,
    MenuItem,
    SelectionBar,
    Tag,
    TagSet,
    toCsv,
  } from "carbon-components-svelte";
  import Download from "carbon-icons-svelte/lib/Download.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "region", value: "Region" },
    { key: "status", value: "Status" },
    { key: "tags", value: "Tags" },
  ];

  const tagOptions = ["production", "staging", "pci"];

  let rows = [
    {
      id: "api-gateway",
      name: "API gateway",
      region: "US East",
      status: "Running",
      tags: ["production"],
    },
    {
      id: "billing",
      name: "Billing",
      region: "Frankfurt",
      status: "Running",
      tags: ["production", "pci"],
    },
    {
      id: "search-index",
      name: "Search index",
      region: "Tokyo",
      status: "Degraded",
      tags: [],
    },
    {
      id: "audit-log",
      name: "Audit log",
      region: "US East",
      status: "Running",
      tags: ["staging"],
    },
    {
      id: "image-resizer",
      name: "Image resizer",
      region: "Sydney",
      status: "Stopped",
      tags: [],
    },
  ];

  let selectedRowIds = ["billing", "search-index"];

  $: selectedRows = rows.filter((row) => selectedRowIds.includes(row.id));

  function deleteSelected() {
    rows = rows.filter((row) => !selectedRowIds.includes(row.id));
    selectedRowIds = [];
  }

  function exportSelected() {
    const csv = toCsv(
      headers.filter((header) => header.key !== "tags"),
      selectedRows,
    );
    downloadFile(csv, "services.csv", "text/csv;charset=utf-8");
  }

  function addTag(tag) {
    rows = rows.map((row) =>
      selectedRowIds.includes(row.id) && !row.tags.includes(tag)
        ? { ...row, tags: [...row.tags, tag] }
        : row,
    );
  }
</script>

<!-- Room at the end of the page, so the bar never covers the last row. -->
<Box paddingBottom={10}>
  <DataTable id="services" batchSelection bind:selectedRowIds {headers} {rows}>
    <svelte:fragment slot="cell" let:cell>
      {#if cell.key === "tags"}
        <TagSet>
          {#each cell.value as tag (tag)}
            <Tag size="sm" type="outline">{tag}</Tag>
          {/each}
        </TagSet>
      {:else}
        {cell.value}
      {/if}
    </svelte:fragment>
  </DataTable>
</Box>

<!-- Delete removes the row whose checkbox focus came from, so focus goes to
  the table's select-all checkbox when the bar hides. -->
<SelectionBar
  count={selectedRowIds.length}
  placement="viewport-end"
  returnFocusTo={() => document.getElementById("services-select-all")}
  selectedText={(count) =>
    `${count} ${count === 1 ? "service" : "services"} selected`}
  on:clear={() => (selectedRowIds = [])}
>
  <svelte:fragment slot="actions">
    <Button icon={TrashCan} on:click={deleteSelected}>Delete</Button>
    <Button icon={Download} on:click={exportSelected}>Export</Button>
    <MenuButton labelText="Add tag" size="lg">
      {#each tagOptions as tag (tag)}
        <MenuItem labelText={tag} on:click={() => addTag(tag)} />
      {/each}
    </MenuButton>
  </svelte:fragment>
</SelectionBar>
