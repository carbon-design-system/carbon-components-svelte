<script lang="ts">
import { Popover } from "carbon-components-svelte";

export let open = false;
export let align:
  | "top"
  | "top-left"
  | "top-right"
  | "bottom"
  | "bottom-left"
  | "bottom-right"
  | "left"
  | "left-bottom"
  | "left-top"
  | "right"
  | "right-bottom"
  | "right-top" = "top";
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
