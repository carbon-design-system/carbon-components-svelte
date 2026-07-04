<script>
  /**
   * @event {HTMLElement} open
   */

  /**
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "select"} trigger
   */

  /**
   * Specify an element or list of elements to trigger the context menu.
   * If no element is specified, the context menu applies to the entire window.
   * @type {null | ReadonlyArray<null | HTMLElement>}
   */
  export let target = null;

  /**
   * Set to `true` to open the menu.
   * Either `x` and `y` must be greater than zero.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify the horizontal offset of the menu position.
   * @bindable writable
   */
  export let x = 0;

  /**
   * Specify the vertical offset of the menu position.
   * @bindable writable
   */
  export let y = 0;

  /**
   * Obtain a reference to the unordered list HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Accessible name for the menu.
   * Prefer setting this (or `aria-label`) when the menu is opened from the window
   * (`target` unset), where there is no visible trigger for `aria-labelledby`.
   * @type {string | undefined}
   */
  export let labelText = undefined;

  /**
   * Specify the size of the menu, which controls each item's row height.
   * @type {"xs" | "sm" | "md" | "lg"}
   */
  export let size = "sm";

  /**
   * Specify the z-index of the menu.
   */
  export let zIndex = 9200;

  /**
   * Anchor to a real element instead of the `x`/`y` point - used internally
   * by `ContextMenuOption` for nested submenus, which (like a `MenuItem`
   * submenu) should open relative to their trigger `<li>`, not a click point.
   * @type {null | HTMLElement}
   */
  export let anchor = null;

  /**
   * Preferred direction to open in. The root, click-triggered menu opens
   * `"bottom"`; a `ContextMenuOption` submenu opens `"right"`.
   * @type {"bottom" | "top" | "left" | "right"}
   */
  export let direction = "bottom";

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
  } from "svelte";
  import { writable } from "svelte/store";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import { dismiss } from "../utils/dismiss.js";
  import { isOutsideClick } from "../utils/isOutsideClick.js";
  import { rovingFocus } from "../utils/rovingFocus.js";

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<number>}
   */
  const currentIndex = writable(-1);
  const hasPopup = writable(false);
  const ctx = getContext("carbon:ContextMenu");

  /** Real, zero-size, in-document element positioned at (x, y) - lets
   * FloatingPortal anchor to an arbitrary point instead of a real trigger
   * element, when `anchor` isn't given. FloatingPortal watches the anchor's
   * `style` attribute via MutationObserver, so updating x/y while open
   * repositions the menu. */
  let pointAnchor;
  $: effectiveAnchor = anchor ?? pointAnchor;

  let options = [];
  let prevX = 0;
  let prevY = 0;
  let prevOpen = false;
  let focusIndex = -1;
  let openDetail = null;

  /**
   * @type {(trigger: "escape-key" | "outside-click" | "select") => void}
   */
  function close(trigger) {
    if (!open) return;
    open = false;
    x = 0;
    y = 0;
    prevX = 0;
    prevY = 0;
    focusIndex = -1;
    dispatch("close", { trigger });
  }

  /** @type {(e: MouseEvent) => void} */
  function openMenu(event) {
    event.preventDefault();
    x = event.x;
    y = event.y;
    open = true;
    openDetail = event.target;
  }

  /** @type {Array<HTMLElement | null>} */
  let boundTargets = [];

  $: {
    for (const node of boundTargets) {
      node?.removeEventListener("contextmenu", openMenu);
    }
    boundTargets =
      target == null ? [] : Array.isArray(target) ? [...target] : [target];
    for (const node of boundTargets) {
      node?.addEventListener("contextmenu", openMenu);
    }
  }

  onMount(() => {
    return () => {
      for (const node of boundTargets) {
        node?.removeEventListener("contextmenu", openMenu);
      }
    };
  });

  /**
   * @type {(popup: boolean) => void}
   */
  function setPopup(popup) {
    hasPopup.set(popup);
  }

  setContext("carbon:ContextMenu", {
    currentIndex,
    close,
    setPopup,
  });

  afterUpdate(() => {
    if (open && ref) {
      options = [...ref.querySelectorAll("li[data-nested='false']")];

      if (level === 1) {
        if (prevX !== x || prevY !== y) ref.focus();
        prevX = x;
        prevY = y;
      }

      if (!prevOpen) dispatch("open", openDetail);
    }
    prevOpen = open;

    if (!$hasPopup && options[focusIndex]) options[focusIndex].focus();
  });

  $: level = ctx ? 2 : 1;
  $: currentIndex.set(focusIndex);
  $: menuAriaLabel = ($$props["aria-label"] ?? labelText) || undefined;

  function handleOutsideClick(event) {
    if (open && ref && isOutsideClick(event, ref)) close("outside-click");
  }
  function handleEscape(event) {
    if (open && event.key === "Escape") close("escape-key");
  }
</script>

<svelte:window
  on:contextmenu={(event) => {
    if (target != null) return;
    if (level > 1) return;
    openMenu(event);
  }}
/>

<div
  bind:this={pointAnchor}
  data-context-menu-point-anchor
  aria-hidden="true"
  style:position="fixed"
  style:top="{y}px"
  style:left="{x}px"
  style:width="0"
  style:height="0"
  style:pointer-events="none"
></div>

<FloatingPortal
  anchor={effectiveAnchor}
  {direction}
  {open}
  intrinsicWidth
  intrinsicAlign="start"
  {zIndex}
  let:direction={portalDirection}
>
  <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
  <ul
    bind:this={ref}
    use:rovingFocus={{
      selector: "li[data-nested='false']",
      orientation: "vertical",
      wrap: false,
      getActiveIndex: () => focusIndex,
      onMove: (index) => {
        if ($hasPopup) return;
        focusIndex = index;
      },
    }}
    use:dismiss={{
      enabled: open,
      listeners: [
        { type: "click", handler: handleOutsideClick },
        { type: "keydown", handler: handleEscape },
      ],
    }}
    role="menu"
    tabindex="-1"
    data-direction={portalDirection}
    data-level={level}
    style:position="relative"
    style:top="auto"
    style:left="auto"
    class:bx--menu={true}
    class:bx--menu--open={open}
    class:bx--menu--root={level === 1}
    class:bx--menu--xs={size === "xs"}
    class:bx--menu--md={size === "md"}
    class:bx--menu--lg={size === "lg"}
    {...$$restProps}
    aria-label={menuAriaLabel}
    on:click
    on:click={(event) => {
      const closestOption = event.target.closest("[tabindex]");

      if (closestOption && closestOption.getAttribute("role") !== "menuitem") {
        close("select");
      }
    }}
    on:keydown
    on:keydown={(event) => {
      if (open) event.preventDefault();
    }}
    on:mouseenter
    on:mouseleave
  >
    <slot />
  </ul>
</FloatingPortal>
