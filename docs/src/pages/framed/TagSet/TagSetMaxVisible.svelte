<script>
  import { Tag, TagSet } from "carbon-components-svelte";

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

<div style="max-width: 20rem;">
  <TagSet maxVisible={3}>
    {#each categories as category}
      <Tag type={category.type}>{category.label}</Tag>
    {/each}
  </TagSet>
</div>
