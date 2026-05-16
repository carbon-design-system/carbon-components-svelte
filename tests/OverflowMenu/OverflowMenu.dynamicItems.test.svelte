<script lang="ts">
  import { OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";

  export let showMiddle = true;
</script>

<OverflowMenu>
  <OverflowMenuItem text="First" />
  {#if showMiddle}
    <OverflowMenuItem text="Middle" />
  {/if}
  <OverflowMenuItem text="Last" />
</OverflowMenu>
