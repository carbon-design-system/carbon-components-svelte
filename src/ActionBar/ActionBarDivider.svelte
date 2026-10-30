<script>
  /**
   * A line between groups of buttons. It shows only between two buttons that
   * show: when the bar collapses one side into the "More" menu, the divider
   * goes with it, and the menu gets one of its own.
   * @restProps {div}
   */

  import { getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import { uniqueId } from "../utils/unique-id.js";

  const bar = getContext("carbon:ActionBar");
  const group = getContext("carbon:ActionBarGroup");
  const id = uniqueId("ccs-action-bar-divider");
  const hidden = bar?.hidden ?? readable(new Set());
  const orientation = bar?.orientation ?? readable("horizontal");

  /** @type {null | HTMLDivElement} */
  let ref = null;

  onMount(() =>
    bar?.register({
      id,
      kind: "divider",
      node: ref ?? undefined,
      groupId: group?.id,
      priority: 0,
      pinned: false,
      focusable: false,
      managed: false,
      label: "",
      icon: undefined,
      disabled: false,
      checked: undefined,
      radio: false,
      groupLabel: "",
      shortcut: "",
      danger: false,
      activate() {},
    }),
  );
</script>

<div
  bind:this={ref}
  role="separator"
  aria-orientation={$orientation === "vertical" ? "horizontal" : "vertical"}
  {...$$restProps}
  class:bx--action-bar__divider={true}
  class:bx--action-bar__divider--collapsed={$hidden.has(id)}
></div>
