<script>
  import { RecursiveList } from "carbon-components-svelte";

  const nodes = [
    { id: "intro", text: "Introduction" },
    { id: "guide", text: "Guide", nodes: [{ id: "guide-1", text: "Setup" }] },
    { id: "api", text: "API reference" },
  ];
</script>

<RecursiveList {nodes} />
