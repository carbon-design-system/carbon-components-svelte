<script lang="ts">
  import { RecursiveList } from "carbon-components-svelte";

  type TestNode = {
    text?: string;
    href?: string;
    html?: string;
    nodes?: TestNode[];
  };

  const nodes: TestNode[] = [
    {
      text: "Item 1",
      nodes: [
        {
          text: "Item 1a",
          nodes: [{ html: "<h5>HTML content</h5>" }],
        },
      ],
    },
    {
      text: "Item 2",
      nodes: [
        { href: "https://svelte.dev/" },
        {
          href: "https://svelte.dev/",
          text: "Link with custom text",
        },
      ],
    },
    { text: "Item 3" },
  ];
</script>

<RecursiveList type="ordered" {nodes} />
