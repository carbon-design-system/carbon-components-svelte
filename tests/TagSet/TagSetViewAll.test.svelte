<script lang="ts">
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import TagSet from "carbon-components-svelte/TagSet/TagSet.svelte";
  import type { ComponentProps } from "svelte";

  export let count = 15;
  export let overflowMode: ComponentProps<TagSet>["overflowMode"] = "popover";
  export let overflowType: ComponentProps<TagSet>["overflowType"] = undefined;
  export let preventOverflowClick = false;
  export let onTagClose: (value: unknown) => void = () => {};

  let labels = Array.from(
    { length: count },
    (_, index) => `region-${String(index + 1).padStart(2, "0")}`,
  );
</script>

<TagSet
  {overflowMode}
  {overflowType}
  maxVisible={2}
  on:click:overflow={(event) => {
    if (preventOverflowClick) event.preventDefault();
  }}
  on:close:tag={({ detail }) => {
    onTagClose(detail.tag.value);
    labels = labels.filter((label) => label !== detail.tag.value);
  }}
>
  {#each labels as label (label)}
    <Tag filter value={label} type="teal">{label}</Tag>
  {/each}
</TagSet>
