<script>
  import { Box, Tag, TagSet } from "carbon-components-svelte";

  let tags = [
    { id: "prod", label: "Production", type: "red" },
    { id: "staging", label: "Staging", type: "blue" },
    { id: "dev", label: "Development", type: "purple" },
    { id: "qa", label: "QA", type: "green" },
    { id: "sandbox", label: "Sandbox", type: "magenta" },
    { id: "canary", label: "Canary", type: "teal" },
  ];

  function handleTagClose({ detail }) {
    tags = tags.filter((tag) => tag.id !== detail.tag.value);
  }
</script>

<Box maxWidth="16rem">
  <TagSet overflowMode="popover" on:close:tag={handleTagClose}>
    {#each tags as tag (tag.id)}
      <Tag type={tag.type} value={tag.id} filter>{tag.label}</Tag>
    {/each}
  </TagSet>
</Box>
