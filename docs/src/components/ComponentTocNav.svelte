<script lang="ts">
  import {
    TableOfContents,
    TableOfContentsGroup,
    TableOfContentsItem,
  } from "carbon-components-svelte";

  export let headings: { id: string; text: string; depth: number }[] = [];

  const API_LINKS = [
    { id: "component-api-props", text: "Props" },
    { id: "component-api-typedefs", text: "Typedefs" },
    { id: "component-api-slots", text: "Slots" },
    { id: "component-api-forwarded-events", text: "Forwarded events" },
    { id: "component-api-dispatched-events", text: "Dispatched events" },
    { id: "component-api-rest-props", text: "restProps" },
  ];
</script>

<!-- Sections land 3rem down, below the sticky header (`scroll-margin-top`). -->
<TableOfContents size="sm" scrollOffset={48}>
  <TableOfContentsGroup labelText="Examples">
    {#each headings as heading (heading.id)}
      <TableOfContentsItem
        href="#{heading.id}"
        level={heading.depth === 3 ? 2 : 1}
        text={heading.text}
      />
    {/each}
  </TableOfContentsGroup>
  <TableOfContentsGroup labelText="Component API">
    {#each API_LINKS as link (link.id)}
      <TableOfContentsItem href="#{link.id}" text={link.text} />
    {/each}
  </TableOfContentsGroup>
</TableOfContents>
