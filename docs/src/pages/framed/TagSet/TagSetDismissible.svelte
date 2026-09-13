<script>
  import { Tag, TagSet } from "carbon-components-svelte";

  let tags = [
    { label: "Beta access", type: "red" },
    { label: "Dark mode", type: "blue" },
    { label: "New dashboard", type: "purple" },
    { label: "Early adopter", type: "green" },
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
