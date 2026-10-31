<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   */

  /**
   * @slot {{}} badge - Compose a `BadgeIndicator` after the label, inside the link.
   */

  /**
   * Specify the `href` attribute.
   * @type {string | undefined}
   */
  export let href = undefined;

  /**
   * Specify the text.
   * @type {string | undefined}
   */
  export let text = undefined;

  /**
   * Specify an icon to render after the text.
   * Alternatively, use the "icon" slot.
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /** Set to `true` to select the item */
  export let isSelected = false;

  /**
   * Obtain a reference to the HTML anchor element.
   * @bindable readonly
   * @type {null | HTMLAnchorElement}
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { get, readable } from "svelte/store";
  import { resolveLinkRel } from "../utils/link-rel.js";
  import { uniqueId } from "../utils/unique-id.js";

  const id = uniqueId();
  const ctx = getContext("carbon:HeaderNavMenu");
  // Only a top-level item roves; items inside a `HeaderNavMenu` belong to its
  // menu.
  const menubar = ctx ? undefined : getContext("carbon:HeaderNav");
  const tabStop = menubar?.tabStop ?? readable(undefined);

  $: ctx?.updateSelectedItems({ id, isSelected });
  // Before `tabindex`, so the tab stop it moves is read in the same update.
  $: if (ref) menubar?.setCurrent(ref, isSelected);

  // Everything is tabbable until the bar knows its items (and without a bar).
  $: tabindex = $tabStop === undefined || $tabStop === ref ? 0 : -1;

  // True when focus leaves the menu past its last item in DOM order. The item
  // list is read on demand since only blur needs it.
  function isLeavingMenu(relatedTarget) {
    const items = get(ctx.menuItems);
    return (
      items.includes(ref) &&
      !items.some(
        (item) =>
          ref.compareDocumentPosition(item) & Node.DOCUMENT_POSITION_FOLLOWING,
      ) &&
      !items.includes(relatedTarget)
    );
  }

  onMount(() => {
    if (ctx && ref) {
      ctx.registerMenuItem(ref);
    }
    if (menubar && ref) {
      menubar.registerItem(ref);
    }
    const node = ref;
    return () => {
      if (menubar && node) {
        menubar.setCurrent(node, false);
        menubar.unregisterItem(node);
      }
      ctx?.updateSelectedItems({ id, isSelected: false });
      if (ctx && ref) {
        ctx.unregisterMenuItem(ref);
      }
    };
  });
</script>

<li role="none">
  <a
    bind:this={ref}
    role="menuitem"
    {tabindex}
    {href}
    rel={resolveLinkRel($$restProps.target, $$restProps.rel)}
    class:bx--header__menu-item={true}
    class:bx--header__menu-item--icon={icon || $$slots.icon}
    class:bx--header__menu-item--current={isSelected}
    aria-current={isSelected ? "page" : undefined}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keyup
    on:keydown
    on:keydown={(event) => {
      if (ctx && event.key === "Escape") {
        event.preventDefault();
        ctx.closeMenu("escape-key");
      }
    }}
    on:focus
    on:blur
    on:blur={(event) => {
      // Only close menu if blur is moving focus outside the menu past its
      // last item (not when navigating between menu items with arrow keys)
      if (ctx && isLeavingMenu(event.relatedTarget)) {
        ctx.closeMenu("blur");
      }
    }}
  >
    <!-- Menu rows wrap long labels; top-level menubar items stay on one line. -->
    <span class:bx--text-truncate--end={!ctx}><slot>{text}</slot></span>
    {#if icon || $$slots.icon}
      <slot name="icon">
        <svelte:component this={icon} size={16} />
      </slot>
    {/if}
    {#if $$slots.badge}
      <span class:bx--header__menu-item-badge={true}
        ><slot name="badge" /></span
      >
    {/if}
  </a>
</li>
