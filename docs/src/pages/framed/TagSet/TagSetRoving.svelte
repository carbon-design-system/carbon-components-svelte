<script>
  import { Tag, TagSet } from "carbon-components-svelte";

  let tags = [
    { id: "beta", label: "Beta access", type: "red" },
    { id: "dark", label: "Dark mode", type: "blue" },
    { id: "dashboard", label: "New dashboard", type: "purple" },
    { id: "early", label: "Early adopter", type: "green" },
    { id: "export", label: "CSV export", type: "teal" },
  ];

  function handleTagClose({ detail }) {
    tags = tags.filter((tag) => tag.id !== detail.tag.value);
  }
</script>

<TagSet navigation="roving" multiline on:close:tag={handleTagClose}>
  {#each tags as tag (tag.id)}
    <Tag type={tag.type} value={tag.id} filter>{tag.label}</Tag>
  {/each}
</TagSet>
