<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";

  export let showMiddle = true;
</script>

<OverflowMenu>
  <OverflowMenuItem text="First" />
  {#if showMiddle}
    <OverflowMenuItem text="Middle" />
  {/if}
  <OverflowMenuItem text="Last" />
</OverflowMenu>
