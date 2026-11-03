<script lang="ts">
  import Popover from "carbon-components-svelte/Popover/Popover.svelte";
  import type { ComponentProps } from "svelte";

  export let open = true;
  export let portalPopover: boolean | undefined = false;
  export let transition: ComponentProps<Popover>["transition"] = undefined;
  export let onOutroEnd: () => void = () => {};
  export let onIntroStart: () => void = () => {};

  let ref: null | HTMLDivElement = null;
</script>

<div data-testid="anchor">
  <button type="button">Trigger</button>
  <Popover
    bind:ref
    {open}
    {portalPopover}
    {transition}
    id="pop"
    on:introstart={onIntroStart}
    on:outroend={onOutroEnd}
  >
    <p data-testid="content">Content</p>
  </Popover>
</div>
<span data-testid="ref">{ref?.id ?? "none"}</span>
