<script>
  import { Tag, TagSet } from "carbon-components-svelte";

  let tags = [
    { label: "Angular", type: "red" },
    { label: "React", type: "blue" },
    { label: "Svelte", type: "purple" },
    { label: "Vue", type: "green" },
    { label: "Ember", type: "magenta" },
    { label: "Preact", type: "cyan" },
    { label: "Solid", type: "teal" },
    { label: "Qwik", type: "cool-gray" },
  ];

  function handleTagClose({ detail }) {
    tags = tags.filter((_, index) => index !== detail.index);
  }
</script>

<div style="max-width: 16rem;">
  <TagSet on:close:tag={handleTagClose}>
    {#each tags as tag}
      <Tag type={tag.type} filter>{tag.label}</Tag>
    {/each}
  </TagSet>
</div>
