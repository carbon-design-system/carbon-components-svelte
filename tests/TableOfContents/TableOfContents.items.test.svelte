<script lang="ts">
  import TableOfContents from "carbon-components-svelte/TableOfContents/TableOfContents.svelte";
  import TableOfContentsItem from "carbon-components-svelte/TableOfContents/TableOfContentsItem.svelte";

  type Item = { href: string; text: string };

  /** Links to list; every section id stays in the page. */
  export let items: Item[] = [];
  /** Ids of the sections in the page. */
  export let sectionIds: string[] = [];
  export let selectedId: string | undefined = undefined;
  export let noScrollSpy = true;
</script>

<TableOfContents bind:selectedId {noScrollSpy}>
  {#each items as item (item.href)}
    <TableOfContentsItem href={item.href} text={item.text} />
  {/each}
</TableOfContents>

<div data-testid="selected-id">{selectedId ?? ""}</div>

{#each sectionIds as id (id)}
  <section {id}>{id}</section>
{/each}
