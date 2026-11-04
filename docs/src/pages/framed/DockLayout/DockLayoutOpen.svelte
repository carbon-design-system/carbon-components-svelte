<script>
  import {
    addDockTab,
    Box,
    Button,
    closeDockTab,
    DockLayout,
    Stack,
  } from "carbon-components-svelte";

  const documents = [
    { id: "main", label: "main.tf" },
    { id: "variables", label: "variables.tf" },
    { id: "outputs", label: "outputs.tf" },
    { id: "deploy", label: "deploy.yaml" },
  ];

  /** @type {import("carbon-components-svelte/DockLayout/DockLayout.svelte").DockLayoutNode} */
  let layout = {
    type: "row",
    sizes: [50, 50],
    children: [
      { type: "group", id: "group-1", tabs: ["main"] },
      { type: "group", id: "group-2", tabs: ["variables"] },
    ],
  };
  let activeGroupId = null;

  const tabsIn = (node) =>
    node.type === "group" ? node.tabs : node.children.flatMap(tabsIn);

  $: open = new Set(tabsIn(layout));
</script>

<Stack gap={5}>
  <Stack gap={3} orientation="horizontal">
    {#each documents as document (document.id)}
      <Button
        size="small"
        kind="tertiary"
        on:click={() =>
          (layout = open.has(document.id)
            ? closeDockTab(layout, document.id)
            : addDockTab(layout, document.id, activeGroupId ?? undefined))}
      >
        {open.has(document.id) ? "Close" : "Open"}
        {document.label}
      </Button>
    {/each}
  </Stack>
  <Box height="18rem" border="subtle">
    <DockLayout
      bind:layout
      bind:activeGroupId
      {documents}
      aria-label="Workspace"
    >
      <svelte:fragment slot="panel" let:document>
        <p>{document.label} content</p>
      </svelte:fragment>
    </DockLayout>
  </Box>
</Stack>
