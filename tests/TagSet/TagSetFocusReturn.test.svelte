<script lang="ts">
  import Tag from "carbon-components-svelte/Tag/Tag.svelte";
  import TagSet from "carbon-components-svelte/TagSet/TagSet.svelte";

  export let labels = ["Tag 1", "Tag 2", "Tag 3"];
  export let moveFocusOnClose = false;

  let elsewhere: HTMLInputElement;
</script>

<TagSet
  on:close:tag={({ detail }) => {
    labels = labels.filter((_, index) => index !== detail.index);
    if (moveFocusOnClose) elsewhere.focus();
  }}
>
  {#each labels as label (label)}
    <Tag filter>{label}</Tag>
  {/each}
</TagSet>

<input aria-label="Elsewhere" bind:this={elsewhere}>
