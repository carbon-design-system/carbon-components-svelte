<script>
  import {
    Box,
    closeDockTab,
    ConfirmModal,
    DockLayout,
  } from "carbon-components-svelte";

  const documents = [
    { id: "main", label: "main.tf", modified: false },
    { id: "variables", label: "variables.tf", modified: true },
    { id: "outputs", label: "outputs.tf", modified: false },
    { id: "deploy", label: "deploy.yaml", modified: true },
  ];

  /** @type {import("carbon-components-svelte/DockLayout/DockLayout.svelte").DockLayoutNode} */
  let layout = {
    type: "row",
    sizes: [50, 50],
    children: [
      { type: "group", id: "group-1", tabs: ["main", "variables"] },
      { type: "group", id: "group-2", tabs: ["outputs", "deploy"] },
    ],
  };

  let open = false;
  let pending;

  function handleLayoutChange(event) {
    const { type, tabId } = event.detail;
    const document = documents.find((document) => document.id === tabId);

    if (type !== "close" || !document.modified) return;

    // Keep the tab until the dialog answers.
    event.preventDefault();
    pending = document;
    open = true;
  }
</script>

<Box height="18rem" border="subtle">
  <DockLayout
    bind:layout
    {documents}
    aria-label="Workspace"
    on:layoutchange={handleLayoutChange}
  >
    <svelte:fragment slot="panel" let:document>
      <p>{document.label} content</p>
    </svelte:fragment>
  </DockLayout>
</Box>

<ConfirmModal
  bind:open
  kind="warning"
  title="Discard changes to {pending?.label}?"
  confirmText="Discard"
  cancelText="Keep editing"
  on:confirm={() => (layout = closeDockTab(layout, pending.id))}
>
  <p>Changes you made to this file will be lost.</p>
</ConfirmModal>
