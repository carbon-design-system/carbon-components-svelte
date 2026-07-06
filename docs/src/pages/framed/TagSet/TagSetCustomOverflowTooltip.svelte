<script>
  import { Tag, TagSet } from "carbon-components-svelte";

  const frameworks = [
    { label: "Angular", type: "red" },
    { label: "React", type: "blue" },
    { label: "Svelte", type: "purple" },
    { label: "Vue", type: "green" },
    { label: "Ember", type: "magenta" },
    { label: "Preact", type: "cyan" },
  ];
</script>

<div style="max-width: 12rem;">
  <TagSet>
    {#each frameworks as framework}
      <Tag type={framework.type}>{framework.label}</Tag>
    {/each}
    <svelte:fragment slot="overflowTooltip" let:tags let:count>
      <strong>{count} more:</strong>&nbsp;{tags
        .map((tag) => tag.label)
        .join(", ")}
    </svelte:fragment>
  </TagSet>
</div>
