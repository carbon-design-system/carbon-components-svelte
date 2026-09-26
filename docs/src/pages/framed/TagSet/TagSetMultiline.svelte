<script>
  import { Box, Tag, TagSet } from "carbon-components-svelte";

  const categories = [
    { label: "Compute", type: "red" },
    { label: "Storage", type: "blue" },
    { label: "Networking", type: "purple" },
    { label: "Database", type: "green" },
    { label: "Analytics", type: "magenta" },
    { label: "Security", type: "cyan" },
    { label: "Identity", type: "teal" },
    { label: "Monitoring", type: "cool-gray" },
    { label: "Billing", type: "warm-gray" },
    { label: "DevOps", type: "outline" },
  ];
</script>

<Box maxWidth="20rem">
  <TagSet multiline>
    {#each categories as category}
      <Tag type={category.type}>{category.label}</Tag>
    {/each}
  </TagSet>
</Box>
