<script>
  import {
    ConfirmModal,
    Tab,
    TabContent,
    Tabs,
  } from "carbon-components-svelte";

  let selectedId = "main";
  let files = [
    { id: "main", label: "main.tf", modified: false },
    { id: "variables", label: "variables.tf", modified: true },
    { id: "outputs", label: "outputs.tf", modified: false },
    { id: "providers", label: "providers.tf", modified: true },
  ];

  let open = false;
  let pending;

  function close(id) {
    files = files.filter((file) => file.id !== id);
  }

  function handleDismiss(event) {
    const file = files.find((file) => file.id === event.detail.id);

    if (!file.modified) {
      close(file.id);
      return;
    }

    // Keep the tab until the dialog answers.
    event.preventDefault();
    pending = file;
    open = true;
  }
</script>

<Tabs bind:selectedId dismissible on:dismiss={handleDismiss}>
  {#each files as file (file.id)}
    <Tab id={file.id} label={file.label} modified={file.modified} />
  {/each}
  <svelte:fragment slot="content">
    {#each files as file (file.id)}
      <TabContent>{file.label} content</TabContent>
    {/each}
  </svelte:fragment>
</Tabs>

<ConfirmModal
  bind:open
  kind="warning"
  title="Discard changes to {pending?.label}?"
  confirmText="Discard"
  cancelText="Keep editing"
  on:confirm={() => close(pending.id)}
>
  <p>Changes you made to this file will be lost.</p>
</ConfirmModal>
