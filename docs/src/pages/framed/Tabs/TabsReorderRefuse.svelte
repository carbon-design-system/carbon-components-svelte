<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";

  let selectedId = "overview";
  let views = [
    { id: "overview", label: "Overview", pinned: true },
    { id: "errors", label: "Errors" },
    { id: "latency", label: "Latency" },
    { id: "traces", label: "Traces" },
  ];

  function handleReorder(event) {
    const { id, newIndex } = event.detail;
    const moved = views.find((view) => view.id === id);

    // The pinned view stays first, and nothing moves in front of it.
    if (moved.pinned || newIndex === 0) {
      event.preventDefault();
      return;
    }

    const next = views.filter((view) => view.id !== id);
    next.splice(newIndex, 0, moved);
    views = next;
  }
</script>

<Tabs bind:selectedId reorderable on:reorder={handleReorder}>
  {#each views as view (view.id)}
    <Tab id={view.id} label={view.label} />
  {/each}
  <svelte:fragment slot="content">
    {#each views as view (view.id)}
      <TabContent>{view.label} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
