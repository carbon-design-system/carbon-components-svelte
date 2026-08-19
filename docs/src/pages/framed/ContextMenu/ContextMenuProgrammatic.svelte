<script>
  import {
    Button,
    ContextMenu,
    ContextMenuDivider,
    ContextMenuOption,
  } from "carbon-components-svelte";
  import CopyFile from "carbon-icons-svelte/lib/CopyFile.svelte";
  import Cut from "carbon-icons-svelte/lib/Cut.svelte";
  import OverflowMenuVertical from "carbon-icons-svelte/lib/OverflowMenuVertical.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";

  let trigger;
  let open = false;
  let x = 0;
  let y = 0;

  function handleClick() {
    const { left, bottom } = trigger.getBoundingClientRect();
    x = left;
    y = bottom;
    open = true;
  }
</script>

<Button
  kind="ghost"
  icon={OverflowMenuVertical}
  iconDescription="Open row actions"
  bind:ref={trigger}
  on:click={handleClick}
/>

<ContextMenu bind:open bind:x bind:y labelText="Row actions">
  <ContextMenuOption labelText="Copy" icon={CopyFile} />
  <ContextMenuOption labelText="Cut" icon={Cut} />
  <ContextMenuDivider />
  <ContextMenuOption kind="danger" labelText="Delete" icon={TrashCan} />
</ContextMenu>
