<script>
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import TagSet from "carbon-components-svelte/TagSet/TagSet.svelte";

  const regions = [
    "us-south",
    "us-east",
    "eu-de",
    "eu-gb",
    "eu-es",
    "jp-tok",
    "jp-osa",
    "au-syd",
  ];
  // The test mounts a second set once the font is in, as the reference.
  let late = false;
</script>

<button type="button" on:click={() => (late = true)}>Mount late set</button>

<!-- 253px: with IBM Plex in place of the fallback font, one more tag
  overflows. -->
{#each late ? ["early", "late"] : ["early"] as when (when)}
  <div data-testid={when} style="inline-size: 253px">
    <TagSet>
      {#each regions as region (region)}<Tag type="teal">{region}</Tag>{/each}
    </TagSet>
  </div>
{/each}
