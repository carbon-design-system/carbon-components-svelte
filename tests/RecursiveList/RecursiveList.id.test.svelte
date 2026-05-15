<script lang="ts">
  import { RecursiveList } from "carbon-components-svelte";

  type TestNode = {
    id?: string | number;
    text?: string;
    nodes?: TestNode[];
  };

  export let nodes: TestNode[] = [
    { id: "a", text: "Item A" },
    { id: 2, text: "Item B" },
    { id: "c", text: "Item C", nodes: [{ id: "c1", text: "Item C1" }] },
  ];
</script>

<RecursiveList {nodes} />
