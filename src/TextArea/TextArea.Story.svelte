<script>
  export let story = undefined;

  import TextArea from "./TextArea.svelte";
  import TextAreaSkeleton from "./TextArea.Skeleton.svelte";

  $: ref = null;
  $: console.log(ref);
  $: value = "";
  $: console.log("bound value:", value);
</script>

{#if story === 'skeleton'}
  <TextAreaSkeleton {...$$props} />
{:else}
  <TextArea {...$$props} bind:value bind:ref />
{/if}
