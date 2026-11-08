<script lang="ts">
  import TableOfContents from "carbon-components-svelte/TableOfContents/TableOfContents.svelte";
  import TableOfContentsGroup from "carbon-components-svelte/TableOfContents/TableOfContentsGroup.svelte";
  import TableOfContentsItem from "carbon-components-svelte/TableOfContents/TableOfContentsItem.svelte";

  export let size: "sm" | "md" = "md";
</script>

<TableOfContents {size} noScrollSpy data-testid="toc">
  <TableOfContentsGroup labelText="Examples">
    <TableOfContentsItem href="#overview" text="Overview" />
  </TableOfContentsGroup>
  <TableOfContentsGroup>
    <svelte:fragment slot="labelChildren">Reference</svelte:fragment>
    <TableOfContentsItem href="#props" text="Props" />
  </TableOfContentsGroup>
</TableOfContents>

<section id="overview">Overview</section>
<section id="props">Props</section>
