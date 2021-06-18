<script>
  import {
    ContextMenuDivider,
    ContextMenuOption,
    ContextMenuInner,
  } from "carbon-components-svelte";
  import CopyFile16 from "carbon-icons-svelte/lib/CopyFile16";
  import Cut16 from "carbon-icons-svelte/lib/Cut16";

  let ref;
  let open = false;
  let x = 0;
  let y = 0;
</script>

<svelte:window
  on:click="{(e) => {
    if (e.target.contains(ref)) open = false;
  }}"
  on:keydown="{(e) => {
    if (open && e.key === 'Escape') open = false;
  }}"
/>

<div
  on:contextmenu|preventDefault="{(e) => {
    x = e.x;
    y = e.y;
    open = true;
  }}"
></div>

<ContextMenuInner bind:ref bind:open bind:x bind:y>
  <ContextMenuOption
    indented
    labelText="Copy"
    shortcutText="Ctrl+C"
    icon="{CopyFile16}"
  />
  <ContextMenuOption
    indented
    labelText="Cut"
    shortcutText="Ctrl+X"
    icon="{Cut16}"
  />
  <ContextMenuDivider />
  <ContextMenuOption indented kind="danger" labelText="Delete" />
</ContextMenuInner>

<style>
  div {
    position: absolute;
    width: 50%;
    height: 50%;
    left: 25%;
    top: 25%;
    background-color: black;
  }
</style>
