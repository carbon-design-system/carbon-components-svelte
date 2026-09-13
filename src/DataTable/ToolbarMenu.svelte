<script>
  /** @extends {"../OverflowMenu/OverflowMenu.svelte"} OverflowMenuProps */

  import { getContext, onMount } from "svelte";
  import Settings from "../icons/Settings.svelte";
  import OverflowMenu from "../OverflowMenu/OverflowMenu.svelte";

  const ctx = getContext("carbon:Toolbar") ?? {};

  let menuRef = null;
  let prevVisible = false;

  $: {
    const visible = menuRef != null;
    if (visible !== prevVisible) {
      prevVisible = visible;
      ctx.setOverflowVisible?.(visible);
    }
  }

  onMount(() => () => {
    if (prevVisible) ctx.setOverflowVisible?.(false);
  });
</script>

<OverflowMenu
  bind:menuRef
  icon={Settings}
  {...$$restProps}
  class={["bx--toolbar-action", "bx--overflow-menu", $$restProps.class]
    .filter(Boolean)
    .join(" ")}
  flipped
>
  <slot />
</OverflowMenu>
