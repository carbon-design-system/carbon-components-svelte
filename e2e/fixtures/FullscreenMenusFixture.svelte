<script>
  import {
    ComboButton,
    MenuButton,
    MenuItem,
    OverflowMenu,
    OverflowMenuItem,
  } from "carbon-components-svelte";

  let stage = null;
</script>

<button
  type="button"
  data-testid="enter-fullscreen"
  on:click={() => stage?.requestFullscreen()}
>
  Enter fullscreen
</button>

<div
  data-testid="stage"
  bind:this={stage}
  style="background: white; padding: 2rem;"
>
  <MenuButton labelText="Actions">
    <MenuItem>Cut</MenuItem>
    <MenuItem>Copy</MenuItem>
  </MenuButton>
  <ComboButton labelText="Save">
    <MenuItem>Save as</MenuItem>
  </ComboButton>
  <OverflowMenu portalMenu>
    <OverflowMenuItem text="Edit" />
    <OverflowMenuItem text="Delete" />
  </OverflowMenu>
</div>
