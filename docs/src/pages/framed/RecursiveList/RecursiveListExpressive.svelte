<script>
  import { RecursiveList } from "carbon-components-svelte";

  const nodes = [
    {
      text: "Engineering",
      nodes: [
        {
          text: "Platform team",
          nodes: [{ text: "On-call lead" }],
        },
      ],
    },
    {
      text: "Product",
      nodes: [{ text: "Design" }],
    },
    { text: "Customer support" },
  ];
</script>

<RecursiveList expressive {nodes} />
