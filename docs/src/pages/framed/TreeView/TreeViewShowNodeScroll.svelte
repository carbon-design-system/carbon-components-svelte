<script>
  import { Button, ButtonSet, Stack, TreeView } from "carbon-components-svelte";

  let treeview = null;
  let status = "";
  const nodes = Array.from({ length: 20 }, (_, folder) => ({
    id: `folder-${folder}`,
    text: `Folder ${folder + 1}`,
    nodes: Array.from({ length: 10 }, (_, file) => ({
      id: `file-${folder}-${file}`,
      text: `File ${folder + 1}.${file + 1}`,
    })),
  }));

  async function scrollTo(id) {
    const found = await treeview?.showNode(id, {
      select: false,
      focus: false,
      scroll: true,
    });
    status = found
      ? `Scrolled to ${treeview.getNode(id).text}`
      : `No node with id "${id}"`;
  }
</script>

<Stack gap={6}>
  <ButtonSet>
    <Button on:click={() => scrollTo("file-17-4")}>Scroll to File 18.5</Button>
    <Button kind="tertiary" on:click={() => scrollTo("file-99-0")}>
      Missing node
    </Button>
  </ButtonSet>
  <div>
    <TreeView
      bind:this={treeview}
      labelText="Files"
      {nodes}
      virtualize={{ maxVisibleRows: 8 }}
    />
  </div>
  <div aria-live="polite">{status}</div>
</Stack>
