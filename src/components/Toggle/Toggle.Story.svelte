<script>
  export let story = undefined;

  import Layout from "../../internal/ui/Layout.svelte";
  import Toggle from "./Toggle.svelte";
  import ToggleSkeleton from "./Toggle.Skeleton.svelte";

  $: toggled = true;
  $: console.log("bind:toggled", toggled);
</script>

<Layout>
  {#if story === 'toggled'}
    <Toggle {...$$props} id="toggle-id" name="toggle-name" bind:toggled />
  {:else if story === 'skeleton'}
    <ToggleSkeleton />
  {:else}
    <Toggle {...$$props} id="toggle-1" />
  {/if}
</Layout>
