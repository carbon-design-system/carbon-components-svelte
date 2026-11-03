<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import ToolbarBatchActions from "carbon-components-svelte/DataTable/ToolbarBatchActions.svelte";
  import PaginationNav from "carbon-components-svelte/PaginationNav/PaginationNav.svelte";
  import SkipToContent from "carbon-components-svelte/UIShell/SkipToContent.svelte";

  export let translated = false;
</script>

<SkipToContent labelText={translated ? "Zum Inhalt springen" : undefined} />
<PaginationNav labelText={translated ? "Seiten" : undefined} total={3} />
<ToolbarBatchActions active cancelText={translated ? "Abbrechen" : undefined} />
<DataTable
  headers={[{ key: "id", value: "Id" }]}
  rows={[{ id: "a" }]}
  rowDecoratorDescription={translated ? "KI-Label" : undefined}
>
  <svelte:fragment slot="rowDecorator">*</svelte:fragment>
</DataTable>
