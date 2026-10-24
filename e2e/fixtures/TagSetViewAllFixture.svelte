<script>
  import { Tag, TagSet } from "carbon-components-svelte";

  const regions = [
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
  const dir = new URLSearchParams(location.search).has("rtl") ? "rtl" : "ltr";
</script>

<div {dir} data-testid="set">
  <TagSet overflowMode="popover" maxVisible={2}>
    {#each regions as region (region)}
      <Tag type="teal" filter value={region}>{region}</Tag>
    {/each}
  </TagSet>
</div>
