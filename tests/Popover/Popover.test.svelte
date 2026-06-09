<script lang="ts">
  import Popover from "carbon-components-svelte/Popover/Popover.svelte";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let align: ComponentProps<Popover>["align"] = "top";
  export let caret = false;
  export let light = false;
  export let highContrast = false;
  export let relative = false;
  export let closeOnOutsideClick = false;
</script>

<div data-testid="parent">
  Parent
  <Popover
    {open}
    {closeOnOutsideClick}
    {align}
    {caret}
    {light}
    {highContrast}
    {relative}
    on:click:outside={(e) => {
      console.log("click:outside", e.detail);
    }}
  >
    <div data-testid="content">Content</div>
  </Popover>
</div>
