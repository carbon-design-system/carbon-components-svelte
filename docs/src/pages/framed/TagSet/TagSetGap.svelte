<script>
  import { Tag, TagSet } from "carbon-components-svelte";

  const frameworks = [
    { label: "Angular", type: "red" },
    { label: "React", type: "blue" },
    { label: "Svelte", type: "purple" },
    { label: "Vue", type: "green" },
  ];
</script>

<TagSet gap="1.5rem">
  {#each frameworks as framework}
    <Tag type={framework.type}>{framework.label}</Tag>
  {/each}
</TagSet>
