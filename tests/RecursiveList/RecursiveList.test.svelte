<script lang="ts">
  import RecursiveList from "carbon-components-svelte/RecursiveList/RecursiveList.svelte";
  import type { RecursiveListNode } from "../../src/RecursiveList/RecursiveList.svelte";

  const nodes: RecursiveListNode[] = [
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
        {
          href: "https://svelte.dev/",
          text: "External link",
          target: "_blank",
        },
        {
          href: "https://svelte.dev/",
          text: "External link with custom rel",
          target: "_blank",
          rel: "noopener",
        },
      ],
    },
    { text: "Item 3" },
  ];
</script>

<RecursiveList type="ordered" {nodes} />
