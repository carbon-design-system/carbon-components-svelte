<script>
  import { Box, Tag, TagSet } from "carbon-components-svelte";

  let regions = [
    "us-south",
    "us-east",
    "eu-de",
    "eu-gb",
    "eu-es",
    "jp-tok",
    "jp-osa",
    "au-syd",
    "ca-tor",
    "br-sao",
    "in-che",
    "kr-seo",
    "fr-par",
    "ch-zur",
  ];

  function handleTagClose({ detail }) {
    regions = regions.filter((region) => region !== detail.tag.value);
  }
</script>

<Box maxWidth="16rem">
  <TagSet overflowMode="popover" on:close:tag={handleTagClose}>
    {#each regions as region (region)}
      <Tag type="teal" value={region} filter>{region}</Tag>
    {/each}
  </TagSet>
</Box>
