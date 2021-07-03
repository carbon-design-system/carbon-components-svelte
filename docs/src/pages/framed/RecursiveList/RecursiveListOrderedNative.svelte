<script>
  import { RecursiveList } from "carbon-components-svelte";

  const items = [
    {
      text: "Item 1",
      items: [
        {
          text: "Link",
          href: "/",
          items: [
            {
              html: "<h5>Hello world</h5>",
              items: [{ text: "Item 1a" }],
            },
          ],
        },
      ],
    },
    {
      text: "Item 2",
      items: [
        {
          text: "Item 2 content",
        },
      ],
    },
    {
      text: "Item 3",
    },
  ];
</script>

<RecursiveList type="ordered-native" items="{items}" />
