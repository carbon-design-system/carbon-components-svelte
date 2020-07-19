<script>
  export let story = undefined;

  import Toggle from "./Toggle.svelte";
  import ToggleSkeleton from "./Toggle.Skeleton.svelte";

  $: toggled = true;
  $: console.log("bind:toggled", toggled);
</script>

{#if story === 'toggled'}
  <Toggle {...$$props} id="toggle-id" name="toggle-name" bind:toggled />
{:else if story === 'skeleton'}
  <ToggleSkeleton />
{:else}
  <Toggle {...$$props} id="toggle-1" />
{/if}
