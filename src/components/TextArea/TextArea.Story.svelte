<script>
  export let story = undefined;

  import Layout from "../../internal/ui/Layout.svelte";
  import TextArea from "./TextArea.svelte";
  import TextAreaSkeleton from "./TextArea.Skeleton.svelte";

  $: ref = null;
  $: console.log(ref);
  $: value = "";
  $: console.log("bound value:", value);
</script>

<Layout>
  {#if story === 'skeleton'}
    <TextAreaSkeleton {...$$props} />
  {:else}
    <TextArea {...$$props} bind:value bind:ref />
  {/if}
</Layout>
