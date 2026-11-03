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
   * @type {null | HTMLUListElement}
   */
  export let ref = null;

  /**
   * Accessible name for the menu.
   * Prefer setting this (or `aria-label`) when the menu is opened from the window
   * (`target` unset), where there is no visible trigger for `aria-labelledby`.
   * @type {string | undefined}
   */
  export let labelText = undefined;

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
  } from "svelte";
  import { writable } from "svelte/store";
  import { dismiss } from "../utils/dismiss.js";
  import { focusQuietly } from "../utils/focus.js";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { menuOptionLabel } from "../utils/menu-option-label.js";
  import { fitMenuAxis } from "../utils/menu-placement.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import {
    createTypeaheadBuffer,
    isTypeaheadKey,
    typeaheadIndex,
  } from "../utils/typeahead.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();
  /**
   * @type {import("svelte/store").Writable<[number, number]>}
   */
  const position = writable([x, y]);
  /**
   * @type {import("svelte/store").Writable<number>}
   */
  const focusedIndex = writable(-1);
  const hasPopup = writable(false);
  const ctx = getContext("carbon:ContextMenu");
  const level = ctx ? 2 : 1;

  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  let options = [];
  let direction = 1;
  let prevX = 0;
  let prevY = 0;
  let prevOpen = false;
  let focusIndex = -1;
  let openDetail = null;
  /** @type {HTMLElement | null} */
  let returnFocus = null;

  const typeahead = createTypeaheadBuffer();

  /**
   * WAI-ARIA APG menu first-character navigation: move focus to the next
   * item, in this menu level only, whose label starts with the
   * buffered characters typed so far. `options` (this level's own
   * `data-nested="false"` items) already excludes any open submenu's items,
   * so a submenu owns its own search once it has focus.
   * @param {string} character
   */
  function typeaheadSearch(character) {
    if (options.length === 0) return;

    const query = typeahead.push(character);

    focusIndex = typeaheadIndex({
      items: options,
      query,
      itemToString: menuOptionLabel,
      index: focusIndex,
    });
  }

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

    if (level === 1 && ref?.contains(document.activeElement)) {
      if (returnFocus?.isConnected) {
        focusQuietly(returnFocus, { preventScroll: true });
      }
      if (ref.contains(document.activeElement)) {
        /** @type {HTMLElement} */ (document.activeElement).blur();
      }
    }
    returnFocus = null;

    dispatch("close", { trigger });
  }

  /**
   * Set when the menu opens from the keyboard (the context menu key or
   * Shift+F10), which fires `contextmenu` with no button down. A
   * right-click opens on the menu itself, like a native context menu.
   */
  let focusFirstOption = false;

  /** @type {(event: MouseEvent) => void} */
  function openMenu(event) {
    event.preventDefault();
    focusFirstOption = event.button !== 2 && event.buttons === 0;
    const { height, width } = ref.getBoundingClientRect();

    // The menu opens toward the inline end of the pointer: the left in RTL.
    if (open || x === 0) {
      x = fitMenuAxis({
        before: event.x,
        after: event.x,
        size: width,
        max: window.innerWidth,
        reverse: resolveLayoutDirection($layoutDirection, ref) === "rtl",
      });
    }

    if (open || y === 0) {
      y = fitMenuAxis({
        before: event.y,
        after: event.y,
        size: height,
        max: window.innerHeight,
      });
    }
    position.set([x, y]);
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

  /** @param {MouseEvent} event */
  function handleWindowContextMenu(event) {
    if (target != null) return;
    if (!ref) return;
    openMenu(event);
  }

  onMount(() => {
    // Only the root menu opens on the page's context menu. Nested menus
    // (one per option with sub-options) skip the window listener.
    if (level === 1) {
      window.addEventListener("contextmenu", handleWindowContextMenu);
    }
    return () => {
      window.removeEventListener("contextmenu", handleWindowContextMenu);
      for (const node of boundTargets) {
        node?.removeEventListener("contextmenu", openMenu);
      }
      typeahead.clear();
    };
  });

  /**
   * @type {(popup: boolean) => void}
   */
  function setPopup(popup) {
    hasPopup.set(popup);
  }

  setContext("carbon:ContextMenu", {
    focusedIndex,
    position,
    close,
    setPopup,
    level,
  });

  afterUpdate(() => {
    if (open) {
      options = [...ref.querySelectorAll("li[data-nested='false']")];

      if (level === 1) {
        if (!prevOpen) {
          const active = document.activeElement;
          returnFocus =
            active instanceof HTMLElement &&
            active !== document.body &&
            !ref.contains(active)
              ? active
              : openDetail instanceof Element
                ? openDetail.closest(FOCUSABLE)
                : null;
        }
        if (prevX !== x || prevY !== y) ref.focus();
        prevX = x;
        prevY = y;
        if (focusFirstOption) {
          focusFirstOption = false;
          const first = options.findIndex(
            (option) => option.getAttribute("aria-disabled") !== "true",
          );
          if (first !== -1) focusIndex = first;
        }
      }

      if (!prevOpen) dispatch("open", openDetail);
    }
    prevOpen = open;

    if (!$hasPopup && options[focusIndex]) options[focusIndex].focus();
  });

  $: focusedIndex.set(focusIndex);
  $: menuAriaLabel = ($$props["aria-label"] ?? labelText) || undefined;

  function handleOutsideClick(event) {
    if (open && isOutsideClick(event, ref)) close("outside-click");
  }
  function handleEscape(event) {
    // Escape that cancels an IME composition is not a close.
    if (open && event.key === "Escape" && !isImeComposition(event)) {
      close("escape-key");
    }
  }
</script>

<ul
  bind:this={ref}
  use:rovingFocus={{
    selector: "li[data-nested='false']",
    orientation: "vertical",
    wrap: false,
    getActiveIndex: () => focusIndex,
    onMove: (index, event) => {
      if ($hasPopup || hasModifierKey(event)) return;
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
  data-direction={direction}
  data-level={level}
  class:bx--menu={true}
  class:bx--menu--open={open}
  class:bx--menu--invisible={open && x === 0 && y === 0}
  class:bx--menu--root={level === 1}
  style:left="{x}px"
  style:top="{y}px"
  {...$$restProps}
  aria-label={menuAriaLabel}
  on:click
  on:keydown
  on:keydown={(event) => {
    if (!open) return;
    if (event.key === "Tab") {
      close("escape-key");
      return;
    }
    if (
      ((event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "Home" ||
        event.key === "End" ||
        event.key === "PageUp" ||
        event.key === "PageDown") &&
        !hasModifierKey(event)) ||
      event.key === " " ||
      event.key === "Enter"
    ) {
      event.preventDefault();
    } else if (
      isTypeaheadKey(event) &&
      // A submenu currently has its own focus/search; let it own this key
      // instead of also moving focus at this level.
      !$hasPopup
    ) {
      event.preventDefault();
      typeaheadSearch(event.key);
    }
  }}
>
  <slot />
</ul>
