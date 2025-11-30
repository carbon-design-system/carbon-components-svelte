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
   */
  export let open = false;

  /** Specify the horizontal offset of the menu position */
  export let x = 0;

  /** Specify the vertical offset of the menu position */
  export let y = 0;

  /** Obtain a reference to the unordered list HTML element */
  export let ref = null;

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
  } from "svelte";
  import { writable } from "svelte/store";

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
  const ctx = getContext("ContextMenu");

  let options = [];
  let direction = 1;
  let prevX = 0;
  let prevY = 0;
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
  function openMenu(e) {
    e.preventDefault();
    const { height, width } = ref.getBoundingClientRect();

    if (open || x === 0) {
      if (window.innerWidth - width < e.x) {
        x = e.x - width;
      } else {
        x = e.x;
      }
    }

    if (open || y === 0) {
      menuOffsetX.set(e.x);

      if (window.innerHeight - height < e.y) {
        y = e.y - height;
      } else {
        y = e.y;
      }
    }
    position.set([x, y]);
    open = true;
    openDetail = e.target;
  }

  $: if (target != null) {
    if (Array.isArray(target)) {
      for (const node of target) {
        node?.addEventListener("contextmenu", openMenu);
      }
    } else {
      target.addEventListener("contextmenu", openMenu);
    }
  }

  onMount(() => {
    return () => {
      if (target != null) {
        if (Array.isArray(target)) {
          for (const node of target) {
            node?.removeEventListener("contextmenu", openMenu);
          }
        } else {
          target.removeEventListener("contextmenu", openMenu);
        }
      }
    };
  });

  /**
   * @type {(popup: boolean) => void}
   */
  const setPopup = (popup) => {
    hasPopup.set(popup);
  };

  setContext("ContextMenu", {
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

      dispatch("open", openDetail);
    } else {
      dispatch("close");
    }

    if (!$hasPopup && options[focusIndex]) options[focusIndex].focus();
  });

  $: level = ctx ? 2 : 1;
  $: currentIndex.set(focusIndex);
</script>

<svelte:window
  on:contextmenu={(e) => {
    if (target != null) return;
    if (level > 1) return;
    if (!ref) return;
    openMenu(e);
  }}
  on:click={(e) => {
    if (!open) return;
    if (ref && !ref.contains(e.target)) {
      close();
    }
  }}
  on:keydown={(e) => {
    if (open && e.key === "Escape") close();
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
  on:click
  on:click={({ target }) => {
    const closestOption = target.closest("[tabindex]");

    if (closestOption && closestOption.getAttribute("role") !== "menuitem") {
      close();
    }
  }}
  on:keydown
  on:keydown={(e) => {
    if (open) e.preventDefault();
    if ($hasPopup) return;

    if (e.key === "ArrowDown") {
      if (focusIndex < options.length - 1) focusIndex++;
    } else if (e.key === "ArrowUp") {
      if (focusIndex === -1) {
        focusIndex = options.length - 1;
      } else {
        if (focusIndex > 0) focusIndex--;
      }
    }
  }}
>
  <slot />
</ul>
