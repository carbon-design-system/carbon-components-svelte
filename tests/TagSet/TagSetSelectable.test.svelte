<script lang="ts">
  import SelectableTag from "carbon-components-svelte/Tag/SelectableTag.svelte";
  import TagSet from "carbon-components-svelte/TagSet/TagSet.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<TagSet>["size"] = undefined;
</script>

<TagSet {size}>
  <SelectableTag>Tag 1</SelectableTag>
  <SelectableTag>Tag 2</SelectableTag>
  <SelectableTag size="lg">Tag 3</SelectableTag>
  <SelectableTag>Tag 4</SelectableTag>
</TagSet>
