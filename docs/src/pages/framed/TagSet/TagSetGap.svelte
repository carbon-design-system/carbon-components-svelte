<script>
  import { Tag, TagSet } from "carbon-components-svelte";

  const environments = [
    { label: "Production", type: "red" },
    { label: "Staging", type: "blue" },
    { label: "Development", type: "purple" },
    { label: "QA", type: "green" },
  ];
</script>

<TagSet gap="1.5rem">
  {#each environments as environment}
    <Tag type={environment.type}>{environment.label}</Tag>
  {/each}
</TagSet>
