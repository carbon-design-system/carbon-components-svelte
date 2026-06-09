<script lang="ts">
  import RecursiveList from "carbon-components-svelte/RecursiveList/RecursiveList.svelte";
  import { toHierarchy } from "carbon-components-svelte/utils/toHierarchy";

  let nodes = toHierarchy(
    [
      { id: 1, text: "Item 1" },
      { id: 2, text: "Item 1a", pid: 1 },
      { id: 3, html: "<h5>HTML content</h5>", pid: 2 },
      { id: 4, text: "Item 2" },
      { id: 5, href: "https://svelte.dev/", pid: 4 },
      {
        id: 6,
        href: "https://svelte.dev/",
        text: "Link with custom text",
        pid: 4,
      },
      {
        id: 8,
        href: "https://svelte.dev/",
        text: "External link",
        target: "_blank",
        pid: 4,
      },
      {
        id: 9,
        href: "https://svelte.dev/",
        text: "External link with custom rel",
        target: "_blank",
        rel: "noopener",
        pid: 4,
      },
      { id: 7, text: "Item 3" },
    ],
    (node) => node.pid,
  );
</script>

<RecursiveList type="ordered" {nodes} />
