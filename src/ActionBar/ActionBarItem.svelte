<script>
  /**
   * Hold a control that is not a button, such as a `Dropdown`, a `Search`
   * or a `NumberInput`. The item is one stop of the bar, and the control
   * keeps the keys it uses for itself: a field keeps Left, Right, Home and
   * End until its caret reaches an edge, where Left and Right move on; a
   * dropdown keeps Up and Down. Tab leaves the bar from any item.
   *
   * An item never collapses into the "More" menu, since a control cannot be
   * copied into it.
   *
   * @restProps {div}
   * @slot {{}}
   */

  /** Specify the id of the item. */
  export let id = uniqueId("ccs-action-bar-item");

  /**
   * Obtain a reference to the item element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { uniqueId } from "../utils/unique-id.js";

  const bar = getContext("carbon:ActionBar");
  const group = getContext("carbon:ActionBarGroup");

  onMount(() =>
    bar?.register({
      id,
      kind: "item",
      node: ref ?? undefined,
      groupId: group?.id,
      priority: 0,
      pinned: true,
      focusable: true,
      managed: true,
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

<div bind:this={ref} {id} {...$$restProps} class:bx--action-bar__item={true}>
  <slot />
</div>
