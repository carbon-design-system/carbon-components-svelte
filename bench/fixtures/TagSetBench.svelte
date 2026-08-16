<svelte:options accessors />

<script lang="ts">
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import TagSet from "carbon-components-svelte/TagSet/TagSet.svelte";

  export let count = 100;
</script>

<TagSet>
  {#each { length: count } as _, i}
    <Tag>{`Tag ${i}`}</Tag>
  {/each}
</TagSet>
