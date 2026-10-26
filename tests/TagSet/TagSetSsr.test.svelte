<script lang="ts">
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import TagSet from "carbon-components-svelte/TagSet/TagSet.svelte";

  export let id: string | undefined = undefined;
  export let firstId: string | undefined = undefined;
  export let secondId: string | undefined = undefined;
  export let multiline = false;
</script>

<TagSet {id} {multiline}>
  <Tag id={firstId}>First</Tag>
  <Tag id={secondId}>Second</Tag>
</TagSet>
