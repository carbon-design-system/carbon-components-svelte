<script lang="ts">
  import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
  } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let testComponent:
    | "Table"
    | "TableBody"
    | "TableCell"
    | "TableRow"
    | "TableHead"
    | "TableContainer" = "Table";

  // Table props
  export let size: ComponentProps<Table>["size"] = undefined;
  export let zebra: ComponentProps<Table>["zebra"] = false;
  export let useStaticWidth: ComponentProps<Table>["useStaticWidth"] = false;
  export let sortable: ComponentProps<Table>["sortable"] = false;
  export let stickyHeader: ComponentProps<Table>["stickyHeader"] = false;
  export let tableStyle: ComponentProps<Table>["tableStyle"] = undefined;

  // TableContainer props
  export let title: ComponentProps<TableContainer>["title"] = "";
  export let description: ComponentProps<TableContainer>["description"] = "";

  export let slotContent = "";
</script>

{#if testComponent === "Table"}
  <Table
    {size}
    {zebra}
    {useStaticWidth}
    {sortable}
    {stickyHeader}
    {tableStyle}
    {...$$restProps}
  >
    {#if slotContent}{slotContent}{/if}
    <slot />
  </Table>
{:else if testComponent === "TableBody"}
  <TableBody {...$$restProps}>
    {#if slotContent}{slotContent}{/if}
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
    {#if slotContent}{slotContent}{/if}
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
    {#if slotContent}{slotContent}{/if}
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
    {#if slotContent}{slotContent}{/if}
    <slot />
  </TableHead>
{:else if testComponent === "TableContainer"}
  <TableContainer
    {title}
    {description}
    {stickyHeader}
    {useStaticWidth}
    {...$$restProps}
  >
    {#if slotContent}{slotContent}{/if}
    <slot />
  </TableContainer>
{/if}
