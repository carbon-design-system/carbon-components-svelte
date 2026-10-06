<script>
  import {
    TableOfContents,
    TableOfContentsItem,
  } from "carbon-components-svelte";

  const sections = [
    { id: "overview", text: "Overview" },
    { id: "measures-of-success", text: "Measures of success" },
    { id: "key-moments", text: "Key moments" },
    { id: "tutorials", text: "Tutorials" },
    { id: "articles", text: "Articles" },
  ];

  let selectedId;
</script>

<div class="layout">
  <aside>
    <TableOfContents bind:selectedId data-testid="toc">
      {#each sections as section (section.id)}
        <TableOfContentsItem href="#{section.id}" text={section.text} />
      {/each}
    </TableOfContents>
  </aside>
  <main>
    {#each sections as section (section.id)}
      <section id={section.id}>
        <h2>{section.text}</h2>
      </section>
    {/each}
  </main>
</div>
<output data-testid="selected-id">{selectedId ?? ""}</output>

<style>
  .layout {
    display: flex;
    gap: 2rem;
    padding: 2rem;
  }

  aside {
    position: sticky;
    top: 2rem;
    align-self: flex-start;
    width: 16rem;
  }

  section {
    min-height: 600px;
  }
</style>
