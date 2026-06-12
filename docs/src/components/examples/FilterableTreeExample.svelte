<script lang="ts">
  import { Box, Search, Stack, Text, TreeView } from "carbon-components-svelte";
  import Document from "carbon-icons-svelte/lib/Document.svelte";
  import Folder from "carbon-icons-svelte/lib/Folder.svelte";

  const fileNodes = [
    {
      id: "src",
      text: "src",
      icon: Folder,
      nodes: [
        {
          id: "components",
          text: "components",
          icon: Folder,
          nodes: [
            { id: "Button.svelte", text: "Button.svelte", icon: Document },
            {
              id: "DataTable.svelte",
              text: "DataTable.svelte",
              icon: Document,
            },
            { id: "TreeView.svelte", text: "TreeView.svelte", icon: Document },
          ],
        },
        {
          id: "lib",
          text: "lib",
          icon: Folder,
          nodes: [
            { id: "store.ts", text: "store.ts", icon: Document },
            { id: "utils.ts", text: "utils.ts", icon: Document },
          ],
        },
        { id: "App.svelte", text: "App.svelte", icon: Document },
        { id: "main.ts", text: "main.ts", icon: Document },
      ],
    },
    {
      id: "tests",
      text: "tests",
      icon: Folder,
      nodes: [
        { id: "Button.test.ts", text: "Button.test.ts", icon: Document },
        { id: "DataTable.test.ts", text: "DataTable.test.ts", icon: Document },
      ],
    },
    { id: "package.json", text: "package.json", icon: Document },
    { id: "README.md", text: "README.md", icon: Document },
    { id: "tsconfig.json", text: "tsconfig.json", icon: Document },
  ];

  type FileNode = {
    id: string;
    text: string;
    icon: typeof Folder;
    nodes?: FileNode[];
  };

  let fileFilter = "";
  function filterTree(nodes: FileNode[], query: string): FileNode[] {
    const q = query.trim().toLowerCase();
    if (!q) return nodes;
    const walk = (list: FileNode[]): FileNode[] =>
      list.flatMap((node) => {
        if (node.nodes) {
          const kids = walk(node.nodes);
          if (kids.length || node.text.toLowerCase().includes(q)) {
            return [{ ...node, nodes: kids.length ? kids : node.nodes }];
          }
          return [];
        }
        return node.text.toLowerCase().includes(q) ? [node] : [];
      });
    return walk(nodes as FileNode[]);
  }
  function folderIds(nodes: FileNode[]): string[] {
    return nodes.flatMap((node) =>
      node.nodes ? [node.id, ...folderIds(node.nodes)] : [],
    );
  }
  $: filteredFileTree = filterTree(fileNodes as FileNode[], fileFilter);
  $: expandedFileIds = fileFilter
    ? folderIds(filteredFileTree)
    : ["src", "components"];
</script>

<Box fill="layer-01" padding={7}>
  <Stack gap={4}>
    <Text tag="h3" type="productive-heading-03" color="primary">
      Project files
    </Text>
    <Search size="lg" placeholder="Filter files" bind:value={fileFilter} />
    <div class="tree-scroll">
      {#key fileFilter}
        <TreeView
          size="compact"
          labelText="Files"
          hideLabel
          nodes={filteredFileTree}
          expandedIds={expandedFileIds}
        />
      {/key}
    </div>
  </Stack>
</Box>

<style>
  .tree-scroll {
    height: 18rem;
    overflow-y: auto;
  }
</style>
