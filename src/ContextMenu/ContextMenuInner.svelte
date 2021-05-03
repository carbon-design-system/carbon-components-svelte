<script>
  /**
   * Set to `true` to open the menu
   * Either `x` and `y` must be greater than zero
   * @type {boolean}
   */
  export let open = false;

  /**
   * Specify the horizontal offset of the menu position
   * @type {number}
   */
  export let x = 0;

  /**
   * Specify the vertical offset of the menu position
   * @type {number}
   */
  export let y = 0;

  /**
   * Obtain a reference to the unordered list HTML element
   * @type {HTMLUListElement | null}
   */
  export let ref = null;

  import {
    setContext,
    getContext,
    afterUpdate,
    createEventDispatcher,
  } from "svelte";
  import { writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  const position = writable([x, y]);
  const dimensions = writable([0, 0]);
  const currentIndex = writable(-1);
  const hasPopup = writable(false);
  const ctx = getContext("ContextMenu");

  let options = [];
  let direction = 1;
  let prevX = 0;
  let prevY = 0;
  let focusIndex = -1;
  let level;

  $: level = !ctx ? 1 : 2;
  $: $position = [x, y];
  $: $currentIndex = focusIndex;
  $: if (open && level === 1 && ref != null) {
    const { height, width } = ref.getBoundingClientRect();
    $dimensions = [width, height];

    // if the menu is too far to the right, display it on the left side of the cursor
    if (window.innerWidth - width < x) x -= width;

    // if the menu is too far down, display it above the cursor
    if (window.innerHeight - height < y) y -= height;
  }

  function close() {
    open = false;
    x = 0;
    y = 0;
    prevX = 0;
    prevY = 0;
    focusIndex = -1;
  }

  setContext("ContextMenu", {
    currentIndex,
    position,
    dimensions,
    close,
    setPopup: (popup) => ($hasPopup = popup),
  });

  afterUpdate(() => {
    if (open) {
      options = [...ref.querySelectorAll("li[data-nested='false']")];

      if (level === 1) {
        if (prevX !== x || prevY !== y) ref.focus();
        prevX = x;
        prevY = y;
      }

      dispatch("open");
    } else {
      dispatch("close");
    }

    if (!$hasPopup && options[focusIndex]) options[focusIndex].focus();
  });
</script>

<ul
  bind:this="{ref}"
  role="menu"
  tabindex="-1"
  data-direction="{direction}"
  data-level="{level}"
  class:bx--context-menu="{true}"
  class:bx--context-menu--open="{open}"
  class:bx--context-menu--invisible="{open && x === 0 && y === 0}"
  class:bx--context-menu--root="{level === 1}"
  {...$$restProps}
  style="left: {x}px; top: {y}px; {$$restProps.style}"
  on:click
  on:click="{({ target }) => {
    const closestOption = target.closest('[tabindex]');

    if (closestOption && closestOption.getAttribute('role') !== 'menuitem') {
      close();
    }
  }}"
  on:keydown
  on:keydown="{(e) => {
    if (open) e.preventDefault();
    if ($hasPopup) return;

    if (e.key === 'ArrowDown') {
      if (focusIndex < options.length - 1) focusIndex++;
    } else if (e.key === 'ArrowUp') {
      if (focusIndex === -1) {
        focusIndex = options.length - 1;
      } else {
        if (focusIndex > 0) focusIndex--;
      }
    }
  }}"
>
  <slot />
</ul>
