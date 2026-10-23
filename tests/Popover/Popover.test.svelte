<script lang="ts">
  import type { ComponentProps } from "svelte";
  import Popover from "../../src/Popover/Popover.svelte";

  export let open = false;
  export let align: ComponentProps<Popover>["align"] = "top";
  export let caret = false;
  export let highContrast = false;
  export let dropShadow = true;
  export let border = false;
  export let relative = false;
  export let closeOnOutsideClick = false;
  export let closeOnEscape = false;
  export let onClickOutside: (
    e: CustomEvent<{ target: EventTarget | null }>,
  ) => void = () => {};
  export let onClose: (e: CustomEvent<{ trigger: string }>) => void = () => {};
</script>

<div data-testid="parent">
  Parent
  <Popover
    bind:open
    {closeOnOutsideClick}
    {closeOnEscape}
    {align}
    {caret}
    {highContrast}
    {dropShadow}
    {border}
    {relative}
    on:click:outside={onClickOutside}
    on:close={onClose}
  >
    <div data-testid="content">Content</div>
  </Popover>
</div>
