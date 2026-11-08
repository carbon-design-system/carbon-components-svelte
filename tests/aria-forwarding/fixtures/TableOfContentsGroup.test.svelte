<script lang="ts">
  import TableOfContents from "carbon-components-svelte/TableOfContents/TableOfContents.svelte";
  import TableOfContentsGroup from "carbon-components-svelte/TableOfContents/TableOfContentsGroup.svelte";
  import TableOfContentsItem from "carbon-components-svelte/TableOfContents/TableOfContentsItem.svelte";
</script>

<TableOfContents>
  <TableOfContentsGroup labelText="Examples" {...$$restProps}>
    <TableOfContentsItem href="#overview" text="Overview" />
  </TableOfContentsGroup>
</TableOfContents>
