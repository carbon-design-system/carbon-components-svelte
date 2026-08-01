<script lang="ts">
  import TreeView from "carbon-components-svelte/TreeView/TreeView.svelte";
  import type { ComponentProps } from "svelte";

  export let filterText: ComponentProps<TreeView>["filterText"] = "";

  const nodes: ComponentProps<TreeView>["nodes"] = [
    {
      id: "1",
      text: "Analytics",
      nodes: [
        {
          id: "1-1",
          text: "Engines",
          nodes: [{ id: "1-1-1", text: "Apache Spark" }],
        },
        {
          id: "1-2",
          text: "Warehouse",
          nodes: [{ id: "1-2-1", text: "Db2 Warehouse" }],
        },
      ],
    },
    {
      id: "2",
      text: "Storage",
      nodes: [
        { id: "2-1", text: "Object Storage" },
        { id: "2-2", text: "Block Volume" },
      ],
    },
  ];
</script>

<TreeView labelText="Cloud Products" {nodes} {filterText} />
