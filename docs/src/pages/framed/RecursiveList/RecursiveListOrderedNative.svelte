<script>
  import { RecursiveList } from "carbon-components-svelte";

  const children = [
    {
      text: "Item 1",
      children: [
        {
          text: "Item 1a",
          children: [{ html: "<h5>HTML content</h5>" }],
        },
      ],
    },
    {
      text: "Item 2",
      children: [
        {
          href: "https://svelte.dev/",
        },
        {
          href: "https://svelte.dev/",
          text: "Link with custom text",
        },
      ],
    },
    {
      text: "Item 3",
    },
  ];
</script>

<RecursiveList type="ordered-native" children="{children}" />
