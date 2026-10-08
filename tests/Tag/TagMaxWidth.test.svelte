<script lang="ts">
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import TagSet from "carbon-components-svelte/TagSet/TagSet.svelte";

  export let maxWidth: string | undefined = "8rem";
  export let filter = false;
  export let interactive = false;
  export let href: string | undefined = undefined;
  export let roving = false;
  export let label =
    "status:active AND region:us-south AND service:cloud-object-storage";
</script>

{#if roving}
  <TagSet navigation="roving" multiline>
    <Tag {maxWidth} {filter} {interactive} {href} on:close>{label}</Tag>
  </TagSet>
{:else}
  <Tag {maxWidth} {filter} {interactive} {href} on:close>{label}</Tag>
{/if}
