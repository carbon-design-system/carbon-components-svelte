<script lang="ts">
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import TagSet from "carbon-components-svelte/TagSet/TagSet.svelte";
  import type { ComponentProps } from "svelte";

  export let labels: string[] = ["Tag 1", "Tag 2", "Tag 3", "Tag 4"];
  export let dismissible = false;
  export let manageFocusOnClose = true;
  export let maxVisible: ComponentProps<TagSet>["maxVisible"] = undefined;
  export let size: ComponentProps<TagSet>["size"] = undefined;
  export let gap: ComponentProps<TagSet>["gap"] = undefined;

  export let onTagClose: (detail: { tag: unknown; index: number }) => void =
    () => {};
  export let onOverflowClick: (event: CustomEvent) => void = () => {};
  export let onOverflowChange: (detail: { count: number }) => void = () => {};

  function handleTagClose(detail: { tag: unknown; index: number }) {
    onTagClose(detail);
    if (dismissible) {
      labels = labels.filter((_, index) => index !== detail.index);
    }
  }
</script>

<TagSet
  {maxVisible}
  {size}
  {gap}
  {manageFocusOnClose}
  on:close:tag={({ detail }) => handleTagClose(detail)}
  on:click:overflow={onOverflowClick}
  on:overflow:change={({ detail }) => onOverflowChange(detail)}
>
  {#each labels as label (label)}
    <Tag filter={dismissible}>{label}</Tag>
  {/each}
</TagSet>
