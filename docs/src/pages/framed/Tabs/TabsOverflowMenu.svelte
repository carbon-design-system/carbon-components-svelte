<script>
  import { Tab, TabContent, Tabs } from "carbon-components-svelte";

  const labels = [
    "main.tf",
    "variables.tf",
    "outputs.tf",
    "providers.tf",
    "versions.tf",
    "network.tf",
    "storage.tf",
    "iam.tf",
    "monitoring.tf",
    "locals.tf",
    "data.tf",
    "README.md",
  ];

  let selectedId = "file-1";
  let files = labels.map((label, i) => ({ id: `file-${i + 1}`, label }));

  function handleDismiss({ detail }) {
    files = files.filter((file) => file.id !== detail.id);
  }
</script>

<Tabs bind:selectedId dismissible overflowMenu on:dismiss={handleDismiss}>
  {#each files as file (file.id)}
    <Tab id={file.id} label={file.label} />
  {/each}
  <svelte:fragment slot="content">
    {#each files as file (file.id)}
      <TabContent>{file.label} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>
