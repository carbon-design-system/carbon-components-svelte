<script>
  import { RecursiveList } from "carbon-components-svelte";

  const nodes = [
    "Item 1",
    {
      text: "Item 2",
      nodes: ["Item 2a", "Item 2b"],
    },
    "Item 3",
  ];
</script>

<RecursiveList {nodes} />
