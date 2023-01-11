<script>
  /** @extends {"../OverflowMenu/OverflowMenu.svelte"} OverflowMenuProps */

  import { getContext } from "svelte";
  import Settings from "../icons/Settings.svelte";
  import OverflowMenu from "../OverflowMenu/OverflowMenu.svelte";

  const ctx = getContext("Toolbar");

  let menuRef = null;

  $: ctx.setOverflowVisible(menuRef != null);
  $: if (menuRef) menuRef.style.top = "100%";
</script>

<OverflowMenu
  bind:menuRef
  icon="{Settings}"
  {...$$restProps}
  class="bx--toolbar-action bx--overflow-menu {$$restProps.class}"
  flipped
>
  <slot />
</OverflowMenu>
