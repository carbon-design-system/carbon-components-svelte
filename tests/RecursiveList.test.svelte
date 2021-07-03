<script lang="ts">
  import { RecursiveList } from "../types";

  const children = [
    {
      text: "Item 1",
      children: [
        {
          text: "Link",
          href: "/",
          children: [
            {
              html: "<h5>Hello world</h5>",
              children: [{ text: "Item 1a" }],
            },
          ],
        },
      ],
    },
    {
      text: "Item 2",
      children: [
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

<RecursiveList type="ordered" nested children="{children}" />
