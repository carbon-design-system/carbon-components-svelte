<script lang="ts">
  import {
    TableOfContents,
    TableOfContentsGroup,
    TableOfContentsItem,
  } from "carbon-components-svelte";

  export let sections: {
    id: string;
    label: string;
    groups: { id: string; label: string }[];
  }[] = [];

  /** Link only the top-level sections, for the short mobile list. */
  export let sectionsOnly = false;
</script>

<!-- Groups land below the sticky header (`scroll-margin-top`). -->
<TableOfContents size="sm" scrollOffset={64} labelText="On this page">
  {#each sections as section (section.id)}
    {#if section.groups.length}
      {#if sectionsOnly}
        <TableOfContentsItem href="#{section.id}" text={section.label} />
      {:else}
        <TableOfContentsGroup labelText={section.label}>
          {#each section.groups as group (group.id)}
            <TableOfContentsItem href="#{group.id}" text={group.label} />
          {/each}
        </TableOfContentsGroup>
      {/if}
    {/if}
  {/each}
</TableOfContents>
