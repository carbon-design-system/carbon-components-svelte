<script>
  import { Tag, TagSet } from "carbon-components-svelte";

  const frameworks = [
    { label: "Angular", type: "red" },
    { label: "React", type: "blue" },
    { label: "Svelte", type: "purple" },
    { label: "Vue", type: "green" },
    { label: "Ember", type: "magenta" },
    { label: "Preact", type: "cyan" },
    { label: "Solid", type: "teal" },
    { label: "Qwik", type: "cool-gray" },
    { label: "Lit", type: "warm-gray" },
    { label: "Alpine", type: "outline" },
  ];
</script>

<div style="max-width: 20rem;">
  <TagSet>
    {#each frameworks as framework}
      <Tag type={framework.type}>{framework.label}</Tag>
    {/each}
  </TagSet>
</div>
