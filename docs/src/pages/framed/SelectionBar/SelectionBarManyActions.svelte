<script>
  import {
    Button,
    Checkbox,
    SelectionBar,
    Stack,
  } from "carbon-components-svelte";
  import Archive from "carbon-icons-svelte/lib/Archive.svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Download from "carbon-icons-svelte/lib/Download.svelte";
  import FolderMoveTo from "carbon-icons-svelte/lib/FolderMoveTo.svelte";
  import Share from "carbon-icons-svelte/lib/Share.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  const reports = [
    { id: "q3-revenue", name: "Q3 revenue by region.xlsx" },
    { id: "churn", name: "Customer churn analysis.pdf" },
    { id: "capacity", name: "Cluster capacity plan.docx" },
    { id: "audit", name: "SOC 2 audit evidence.zip" },
  ];

  let selectedIds = ["q3-revenue", "churn", "capacity"];

  function toggle(id, checked) {
    selectedIds = checked
      ? [...selectedIds, id]
      : selectedIds.filter((selectedId) => selectedId !== id);
  }
</script>

<Stack gap={5}>
  <SelectionBar count={selectedIds.length} on:clear={() => (selectedIds = [])}>
    <svelte:fragment slot="actions">
      <Button icon={Download}>Download</Button>
      <Button icon={Share}>Share</Button>
      <Button icon={Copy}>Duplicate</Button>
      <Button icon={FolderMoveTo}>Move</Button>
      <Button icon={Archive}>Archive</Button>
      <Button icon={TrashCan}>Delete</Button>
    </svelte:fragment>
  </SelectionBar>
  <fieldset>
    <legend class="bx--label">Reports</legend>
    {#each reports as report (report.id)}
      <Checkbox
        labelText={report.name}
        checked={selectedIds.includes(report.id)}
        on:check={(event) => toggle(report.id, event.detail)}
      />
    {/each}
  </fieldset>
</Stack>
