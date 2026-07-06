<script lang="ts">
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import TagSet from "carbon-components-svelte/TagSet/TagSet.svelte";

  const labels = ["Tag 1", "Tag 2", "Tag 3", "Tag 4"];
</script>

<TagSet>
  {#each labels as label}
    <Tag>{label}</Tag>
  {/each}
  <svelte:fragment slot="overflowTooltip" let:count>
    {count}
    hidden
    <a href="/all-tags">View all</a>
  </svelte:fragment>
</TagSet>
