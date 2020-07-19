<script>
  export let story = undefined;

  import RadioButton from "./RadioButton.svelte";
  import RadioButtonSkeleton from "./RadioButton.Skeleton.svelte";

  $: checked = false;
</script>

{#if story === 'skeleton'}
  <RadioButtonSkeleton />
{:else}
  <RadioButton {...$$props} bind:checked id="radio-1" />
{/if}
