<script>
  export let story = undefined;

  import Layout from "../../internal/ui/Layout.svelte";
  import RadioButton from "./RadioButton.svelte";
  import RadioButtonSkeleton from "./RadioButton.Skeleton.svelte";

  $: checked = false;
</script>

<Layout>
  {#if story === 'skeleton'}
    <RadioButtonSkeleton />
  {:else}
    <RadioButton {...$$props} bind:checked id="radio-1" />
  {/if}
</Layout>
