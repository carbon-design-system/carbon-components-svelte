<script lang="ts">
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import TagSet from "carbon-components-svelte/TagSet/TagSet.svelte";
  import type { ComponentProps } from "svelte";

  export let labels: string[] = ["Tag 1", "Tag 2", "Tag 3", "Tag 4"];
  export let dismissible = false;
  /** Remove a tag from `labels` when it closes, as a consumer would. */
  export let removeOnClose = false;
  export let values: Array<string | number> | undefined = undefined;
  export let maxVisible: ComponentProps<TagSet>["maxVisible"] = undefined;
  export let size: ComponentProps<TagSet>["size"] = undefined;
  export let gap: ComponentProps<TagSet>["gap"] = undefined;
  export let overflowLabel: ComponentProps<TagSet>["overflowLabel"] = undefined;
  export let multiline: ComponentProps<TagSet>["multiline"] = undefined;
  export let align: ComponentProps<TagSet>["align"] = undefined;
  export let measurementOffset: ComponentProps<TagSet>["measurementOffset"] =
    undefined;
  /** Measure the outer div instead of the set's own wrapper. */
  export let measureOuter = false;

  let outer: HTMLElement | undefined;

  export let onTagClose: (detail: {
    tag: unknown;
    index: number;
  }) => void = () => {};
  export let onOverflowClick: (event: CustomEvent) => void = () => {};
  export let onOverflowChange: (detail: { count: number }) => void = () => {};

  function handleTagClose(detail: { tag: unknown; index: number }) {
    onTagClose(detail);
    if (removeOnClose) {
      labels = labels.filter((_, index) => index !== detail.index);
    }
  }
</script>

<div bind:this={outer} data-testid="outer">
  <TagSet
    {maxVisible}
    {size}
    {gap}
    {overflowLabel}
    {multiline}
    {align}
    {measurementOffset}
    containingElement={measureOuter ? outer : undefined}
    on:close:tag={({ detail }) => handleTagClose(detail)}
    on:click:overflow={onOverflowClick}
    on:overflow:change={({ detail }) => onOverflowChange(detail)}
  >
    {#each labels as label, i (label)}
      <Tag filter={dismissible} value={values?.[i]}>{label}</Tag>
    {/each}
  </TagSet>
</div>
