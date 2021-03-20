<script>
  /**
   * Set to `true` to open the menu
   * Either `x` and `y` must be greater than zero
   */
  export let open = false;

  /** Specify the horizontal offset of the menu position */
  export let x = 0;

  /** Specify the vertical offset of the menu position */
  export let y = 0;

  /** Obtain a reference to the unordered list HTML element */
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
  const currentIndex = writable(-1);
  const hasPopup = writable(false);
  const ctx = getContext("ContextMenu");

  let options = [];
  let direction = 1;
  let prevX = 0;
  let prevY = 0;
  let focusIndex = -1;

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
    close,
    setPopup: (popup) => {
      hasPopup.set(popup);
    },
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

  $: level = !ctx ? 1 : 2;
  $: currentIndex.set(focusIndex);
</script>

<svelte:window
  on:contextmenu|preventDefault="{(e) => {
    if (level > 1) return;
    if (open || x === 0) x = e.x;
    if (open || y === 0) y = e.y;
    position.set([x, y]);
    open = true;
  }}"
  on:click="{(e) => {
    if (!open) return;
    if (e.target.contains(ref)) close();
  }}"
  on:keydown="{(e) => {
    if (open && e.key === 'Escape') close();
  }}"
/>

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
