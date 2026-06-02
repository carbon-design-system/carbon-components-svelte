<script>
  /**
   * @event {HTMLElement} open
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

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
  } from "svelte";
  import { writable } from "svelte/store";
  import { clampIndex } from "../utils/clampIndex.js";
  import { isOutsideClick } from "../utils/isOutsideClick.js";

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<[number, number]>}
   */
  const position = writable([x, y]);
  /**
   * @type {import("svelte/store").Writable<number>}
   */
  const currentIndex = writable(-1);
  const hasPopup = writable(false);
  /**
   * @type {import("svelte/store").Writable<number>}
   */
  const menuOffsetX = writable(0);
  const ctx = getContext("carbon:ContextMenu");

  let options = [];
  let direction = 1;
  let prevX = 0;
  let prevY = 0;
  let prevOpen = false;
  let focusIndex = -1;
  let openDetail = null;

  /**
   * @type {() => void}
   */
  function close() {
    open = false;
    x = 0;
    y = 0;
    prevX = 0;
    prevY = 0;
    focusIndex = -1;
  }

  /** @type {(e: MouseEvent) => void} */
  function openMenu(event) {
    event.preventDefault();
    const { height, width } = ref.getBoundingClientRect();

    if (open || x === 0) {
      if (window.innerWidth - width < event.x) {
        x = event.x - width;
      } else {
        x = event.x;
      }
    }

    if (open || y === 0) {
      menuOffsetX.set(event.x);

      if (window.innerHeight - height < event.y) {
        y = event.y - height;
      } else {
        y = event.y;
      }
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
  const setPopup = (popup) => {
    hasPopup.set(popup);
  };

  setContext("carbon:ContextMenu", {
    menuOffsetX,
    currentIndex,
    position,
    close,
    setPopup,
  });

  afterUpdate(() => {
    if (open) {
      options = [...ref.querySelectorAll("li[data-nested='false']")];

      if (level === 1) {
        if (prevX !== x || prevY !== y) ref.focus();
        prevX = x;
        prevY = y;
      }

      if (!prevOpen) dispatch("open", openDetail);
    } else if (prevOpen) {
      dispatch("close");
    }
    prevOpen = open;

    if (!$hasPopup && options[focusIndex]) options[focusIndex].focus();
  });

  $: level = ctx ? 2 : 1;
  $: currentIndex.set(focusIndex);
  $: menuAriaLabel = ($$props["aria-label"] ?? labelText) || undefined;
</script>

<svelte:window
  on:contextmenu={(event) => {
    if (target != null) return;
    if (level > 1) return;
    if (!ref) return;
    openMenu(event);
  }}
  on:click={(event) => {
    if (open && isOutsideClick(event, ref)) close();
  }}
  on:keydown={(event) => {
    if (open && event.key === "Escape") close();
  }}
/>

<!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
<ul
  bind:this={ref}
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
  on:click={(event) => {
    const closestOption = event.target.closest("[tabindex]");

    if (closestOption && closestOption.getAttribute("role") !== "menuitem") {
      close();
    }
  }}
  on:keydown
  on:keydown={(event) => {
    if (open) event.preventDefault();
    if ($hasPopup) return;

    if (event.key === "ArrowDown") {
      focusIndex = clampIndex(focusIndex, 1, options.length);
    } else if (event.key === "ArrowUp") {
      focusIndex = clampIndex(focusIndex, -1, options.length);
    } else if (event.key === "Home") {
      if (options.length > 0) focusIndex = 0;
    } else if (event.key === "End" && options.length > 0) {
      focusIndex = options.length - 1;
    }
  }}
>
  <slot />
</ul>
