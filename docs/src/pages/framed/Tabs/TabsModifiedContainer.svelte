<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";

  let selectedId = "main";
  let files = [
    { id: "main", label: "main.tf", modified: false },
    { id: "variables", label: "variables.tf", modified: true },
    { id: "outputs", label: "outputs.tf", modified: false },
    { id: "providers", label: "providers.tf", modified: true },
  ];

  function handleDismiss({ detail }) {
    files = files.filter((file) => file.id !== detail.id);
  }
</script>

<Tabs type="container" bind:selectedId dismissible on:dismiss={handleDismiss}>
  {#each files as file (file.id)}
    <Tab id={file.id} label={file.label} modified={file.modified} />
  {/each}
  <svelte:fragment slot="content">
    {#each files as file (file.id)}
      <TabContent>{file.label} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
