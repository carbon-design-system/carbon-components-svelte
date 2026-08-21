<script lang="ts">
  import DataTableTable from "carbon-components-svelte/DataTable/DataTableTable.svelte";
  import TableBody from "carbon-components-svelte/DataTable/TableBody.svelte";
  import TableCell from "carbon-components-svelte/DataTable/TableCell.svelte";
  import TableContainer from "carbon-components-svelte/DataTable/TableContainer.svelte";
  import TableFoot from "carbon-components-svelte/DataTable/TableFoot.svelte";
  import TableHead from "carbon-components-svelte/DataTable/TableHead.svelte";
  import TableRow from "carbon-components-svelte/DataTable/TableRow.svelte";
  import type { ComponentProps } from "svelte";

  export let testComponent:
    | "DataTableTable"
    | "TableBody"
    | "TableCell"
    | "TableRow"
    | "TableHead"
    | "TableFoot"
    | "TableContainer" = "DataTableTable";

  // DataTableTable props
  export let size: ComponentProps<DataTableTable>["size"] = undefined;
  export let zebra: ComponentProps<DataTableTable>["zebra"] = false;
  export let useStaticWidth: ComponentProps<DataTableTable>["useStaticWidth"] = false;
  export let sortable: ComponentProps<DataTableTable>["sortable"] = false;
  export let stickyHeader: ComponentProps<DataTableTable>["stickyHeader"] = false;
  export let tableStyle: ComponentProps<DataTableTable>["tableStyle"] =
    undefined;

  // TableContainer props
  export let title: ComponentProps<TableContainer>["title"] = "";
  export let description: ComponentProps<TableContainer>["description"] = "";

  export let slotContent = "";
</script>

{#if testComponent === "DataTableTable"}
  <DataTableTable
    {size}
    {zebra}
    {useStaticWidth}
    {sortable}
    {stickyHeader}
    {tableStyle}
    {...$$restProps}
  >
    {#if slotContent}
      {slotContent}
    {/if}
    <slot />
  </DataTableTable>
{:else if testComponent === "TableBody"}
  <TableBody {...$$restProps}>
    {#if slotContent}
      {slotContent}
    {/if}
    <slot />
  </TableBody>
{:else if testComponent === "TableCell"}
  <TableCell
    on:click={() => console.log("click")}
    on:mouseover={() => console.log("mouseover")}
    on:mouseenter={() => console.log("mouseenter")}
    on:mouseleave={() => console.log("mouseleave")}
    {...$$restProps}
  >
    {#if slotContent}
      {slotContent}
    {/if}
    <slot />
  </TableCell>
{:else if testComponent === "TableRow"}
  <TableRow
    on:click={() => console.log("click")}
    on:mouseover={() => console.log("mouseover")}
    on:mouseenter={() => console.log("mouseenter")}
    on:mouseleave={() => console.log("mouseleave")}
    {...$$restProps}
  >
    {#if slotContent}
      {slotContent}
    {/if}
    <slot />
  </TableRow>
{:else if testComponent === "TableHead"}
  <TableHead
    on:click={() => console.log("click")}
    on:mouseover={() => console.log("mouseover")}
    on:mouseenter={() => console.log("mouseenter")}
    on:mouseleave={() => console.log("mouseleave")}
    {...$$restProps}
  >
    {#if slotContent}
      {slotContent}
    {/if}
    <slot />
  </TableHead>
{:else if testComponent === "TableFoot"}
  <TableFoot
    on:click={() => console.log("click")}
    on:mouseover={() => console.log("mouseover")}
    on:mouseenter={() => console.log("mouseenter")}
    on:mouseleave={() => console.log("mouseleave")}
    {...$$restProps}
  >
    {#if slotContent}
      {slotContent}
    {/if}
    <slot />
  </TableFoot>
{:else if testComponent === "TableContainer"}
  <TableContainer
    {title}
    {description}
    {stickyHeader}
    {useStaticWidth}
    {...$$restProps}
  >
    {#if slotContent}
      {slotContent}
    {/if}
    <slot />
  </TableContainer>
{/if}
