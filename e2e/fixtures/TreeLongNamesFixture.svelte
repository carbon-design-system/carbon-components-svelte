<script>
  import { TreeView } from "carbon-components-svelte";

  const nodes = [
    {
      id: "projects",
      text: "Datenschutzgrundverordnungskonformitätsprüfung",
      nodes: [
        {
          id: "leaf",
          text: "https://api.example.com/v2/organizations/8f14e45fceea167a",
        },
      ],
    },
    { id: "short", text: "README.md" },
  ];
</script>

<div data-testid="tree" style="width: 14rem">
  <TreeView labelText="Files" {nodes} expandedIds={["projects"]} />
</div>
