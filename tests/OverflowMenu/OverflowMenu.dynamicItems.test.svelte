<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";

  export let showMiddle = true;
  export let middleText = "Middle";
  export let middleDisabled = false;
  export let onClose: (detail: {
    trigger: string;
    index?: number;
    text?: string;
  }) => void = () => {};
</script>

<OverflowMenu on:close={(e) => onClose(e.detail)}>
  <OverflowMenuItem text="First" />
  {#if showMiddle}
    <OverflowMenuItem text={middleText} disabled={middleDisabled} />
  {/if}
  <OverflowMenuItem text="Last" />
</OverflowMenu>
