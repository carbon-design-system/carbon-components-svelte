<script>
  export let story = undefined;

  import ToggleSmall from "./ToggleSmall.svelte";
  import ToggleSmallSkeleton from "./ToggleSmall.Skeleton.svelte";

  $: toggled = true;
  $: console.log("bind:toggled", toggled);
</script>

{#if story === 'toggled'}
  <ToggleSmall
    {...$$props}
    id="toggle-small-id"
    name="toggle-small-name"
    bind:toggled
  />
{:else if story === 'skeleton'}
  <ToggleSmallSkeleton />
{:else}
  <ToggleSmall {...$$props} id="toggle-small-id" name="toggle-small-name" />
{/if}
