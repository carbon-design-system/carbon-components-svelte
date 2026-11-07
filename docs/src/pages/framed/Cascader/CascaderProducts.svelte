<script>
  import { Cascader, Stack } from "carbon-components-svelte";

  const nodes = [
    {
      id: "computers",
      text: "Computers",
      nodes: [
        {
          id: "laptops",
          text: "Laptops",
          nodes: [
            { id: "ultrabook", text: "Ultrabook 14" },
            { id: "workstation", text: "Workstation 16" },
            { id: "chromebook", text: "Chromebook 12" },
          ],
        },
        {
          id: "desktops",
          text: "Desktops",
          nodes: [
            { id: "tower", text: "Tower" },
            { id: "mini", text: "Mini" },
          ],
        },
      ],
    },
    {
      id: "audio",
      text: "Audio",
      nodes: [
        {
          id: "headphones",
          text: "Headphones",
          nodes: [
            { id: "over-ear", text: "Over-ear" },
            { id: "in-ear", text: "In-ear" },
          ],
        },
        {
          id: "speakers",
          text: "Speakers",
          nodes: [{ id: "bookshelf", text: "Bookshelf" }],
        },
      ],
    },
    { id: "gift-cards", text: "Gift cards" },
  ];

  let values = [["computers", "laptops", "ultrabook"]];
  let leaves = [];
</script>

<Stack gap={6}>
  <Cascader
    labelText="Categories"
    label="Choose products"
    {nodes}
    multiple
    bind:values
    levelLabels={["Category", "Subcategory", "Product"]}
  />
  <p>Parents: {JSON.stringify(values)}</p>
  <Cascader
    labelText="Categories, as leaves"
    label="Choose products"
    {nodes}
    multiple
    showChecked="leaf"
    bind:values={leaves}
  />
  <p>Leaves: {JSON.stringify(leaves)}</p>
</Stack>
