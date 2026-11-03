<script lang="ts">
  import type { ComponentProps } from "svelte";
  import Popover from "../../src/Popover/Popover.svelte";

  export let open = true;
  export let portalPopover: boolean | undefined = undefined;
  export let align: ComponentProps<Popover>["align"] = "bottom-start";
  export let className: string | undefined = undefined;
  export let transition: ComponentProps<Popover>["transition"] = undefined;
</script>

<div data-testid="box">
  <div data-testid="anchor">
    <button type="button">Trigger</button>
    <Popover
      {open}
      {portalPopover}
      {align}
      {transition}
      caret
      class={className}
      id="pop"
    >
      <button type="button">Inside</button>
    </Popover>
  </div>
</div>
