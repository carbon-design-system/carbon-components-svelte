<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";

  let selectedId = "main";
  let files = [
    { id: "main", label: "main.tf" },
    { id: "variables", label: "variables.tf" },
    { id: "outputs", label: "outputs.tf" },
    { id: "providers", label: "providers.tf" },
    { id: "readme", label: "README.md" },
  ];

  function handleReorder({ detail }) {
    const next = [...files];
    const [moved] = next.splice(detail.oldIndex, 1);
    next.splice(detail.newIndex, 0, moved);
    files = next;
  }

  function handleDismiss({ detail }) {
    files = files.filter((file) => file.id !== detail.id);
  }
</script>

<Tabs
  type="container"
  bind:selectedId
  dismissible
  reorderable
  on:reorder={handleReorder}
  on:dismiss={handleDismiss}
>
  {#each files as file (file.id)}
    <Tab id={file.id} label={file.label} />
  {/each}
  <svelte:fragment slot="content">
    {#each files as file (file.id)}
      <TabContent>{file.label} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
