<script lang="ts">
  import { RecursiveList } from "../types";

  const children = [
    {
      text: "Item 1",
      children: [{ text: "Item 1a", children: [] }],
    },
    {
      text: "Item 2",
      children: [{ href: "https://svelte.dev/" }],
    },
    { text: "Item 3" },
  ] as const;
</script>

<RecursiveList type="ordered" children="{children}" />
