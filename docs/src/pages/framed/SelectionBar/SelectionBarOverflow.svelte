<script>
  import {
    Button,
    Checkbox,
    MenuButton,
    MenuDivider,
    MenuItem,
    SelectionBar,
    Stack,
  } from "carbon-components-svelte";
  import Download from "carbon-icons-svelte/lib/Download.svelte";
  import FolderMoveTo from "carbon-icons-svelte/lib/FolderMoveTo.svelte";
  import Share from "carbon-icons-svelte/lib/Share.svelte";

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
      <Button icon={FolderMoveTo}>Move</Button>
      <MenuButton labelText="More" size="lg" intrinsicAlign="end">
        <MenuItem labelText="Duplicate" />
        <MenuItem labelText="Archive" />
        <MenuDivider />
        <MenuItem kind="danger" labelText="Delete" />
      </MenuButton>
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
