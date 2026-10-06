<script lang="ts">
  import Table from "carbon-components-svelte/DataTable/Table.svelte";
  import TableBody from "carbon-components-svelte/DataTable/TableBody.svelte";
  import TableCell from "carbon-components-svelte/DataTable/TableCell.svelte";
  import TableContainer from "carbon-components-svelte/DataTable/TableContainer.svelte";
  import TableRow from "carbon-components-svelte/DataTable/TableRow.svelte";

  export let id: string | undefined = undefined;
  export let title = "";
  export let description = "";
</script>

<TableContainer {id} {title} {description}>
  <Table>
    <TableBody>
      <TableRow>
        <TableCell>Cell</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</TableContainer>
