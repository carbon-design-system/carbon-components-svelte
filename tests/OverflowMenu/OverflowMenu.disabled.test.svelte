<script lang="ts">
  import OverflowMenu from "carbon-components-svelte/OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "carbon-components-svelte/OverflowMenu/OverflowMenuItem.svelte";

  export let firstDisabled = false;
</script>

<OverflowMenu>
  <OverflowMenuItem disabled={firstDisabled} text="First" />
  <OverflowMenuItem disabled text="Second (disabled)" />
  <OverflowMenuItem text="Third" />
  <OverflowMenuItem disabled text="Fourth (disabled)" />
</OverflowMenu>
