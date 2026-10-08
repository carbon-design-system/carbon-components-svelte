<script lang="ts">
  import SelectableTag from "carbon-components-svelte/Tag/SelectableTag.svelte";
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import TagSet from "carbon-components-svelte/TagSet/TagSet.svelte";
  import type { ComponentProps } from "svelte";

  export let navigation: ComponentProps<TagSet>["navigation"] = "roving";
  export let maxVisible: ComponentProps<TagSet>["maxVisible"] = undefined;
  export let labels = ["Tag 1", "Tag 2", "Tag 3"];
  export let onTagClose: (detail: {
    index: number;
    tag: { value?: string | number };
  }) => void = () => {};
  export let onClose: (label: string) => void = () => {};
</script>

<button type="button">Before</button>

<TagSet
  {navigation}
  {maxVisible}
  on:close:tag={({ detail }) => {
    onTagClose(detail);
    labels = labels.filter((label) => label !== detail.tag.value);
  }}
>
  <Tag>Read only</Tag>
  {#each labels as label (label)}
    <Tag filter value={label} on:close={() => onClose(label)}>{label}</Tag>
  {/each}
  <Tag interactive>Interactive</Tag>
  <SelectableTag>Selectable</SelectableTag>
</TagSet>

<button type="button">After</button>

<button type="button" on:click={() => (maxVisible = 3)}>Collapse</button>
