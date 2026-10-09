<script lang="ts">
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import TagSet from "carbon-components-svelte/TagSet/TagSet.svelte";

  export let labels = ["Tag 1", "Tag 2", "Tag 3", "Tag 4", "Tag 5"];
  export let custom = false;
  export let onTagClose: (detail: { index: number }) => void = () => {};
  export let onOverflowClick: () => void = () => {};
</script>

{#if custom}
  <TagSet overflowMode="popover" maxVisible={2}>
    {#each labels as label (label)}
      <Tag>{label}</Tag>
    {/each}
    <svelte:fragment slot="overflowTooltip" let:count>
      <a href="#all">View all {count}</a>
    </svelte:fragment>
  </TagSet>
{:else}
  <TagSet
    overflowMode="popover"
    maxVisible={2}
    on:click:overflow={onOverflowClick}
    on:close:tag={({ detail }) => {
      onTagClose(detail);
      labels = labels.filter((label) => label !== detail.tag.value);
    }}
  >
    {#each labels as label (label)}
      <Tag filter value={label} type="blue">{label}</Tag>
    {/each}
  </TagSet>
{/if}
