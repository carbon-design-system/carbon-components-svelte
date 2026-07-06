<script>
  import { Tag, TagSet } from "carbon-components-svelte";

  let tags = [
    { label: "Angular", type: "red" },
    { label: "React", type: "blue" },
    { label: "Svelte", type: "purple" },
    { label: "Vue", type: "green" },
  ];

  function handleTagClose({ detail }) {
    tags = tags.filter((_, index) => index !== detail.index);
  }
</script>

<TagSet on:close:tag={handleTagClose}>
  {#each tags as tag}
    <Tag type={tag.type} filter>{tag.label}</Tag>
  {/each}
</TagSet>
