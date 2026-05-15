<script>
  import { RecursiveList } from "carbon-components-svelte";

  const nodes = [
    {
      text: "Item 1",
      nodes: [
        {
          text: "Item 1a",
          nodes: [{ text: "Item 1a-i" }],
        },
      ],
    },
    {
      text: "Item 2",
      nodes: [{ text: "Item 2a" }],
    },
    { text: "Item 3" },
  ];
</script>

<RecursiveList expressive {nodes} />
