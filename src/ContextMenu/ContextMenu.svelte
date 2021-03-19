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
  const ctx = getContext("ContextMenu");

  let direction = 1;
  let prevX = 0;
  let prevY = 0;

  function close() {
    open = false;
    x = 0;
    y = 0;
  }

  setContext("ContextMenu", { position, close });

  afterUpdate(() => {
    if (open && level === 1) {
      if (prevX !== x || prevY !== y) ref.focus();
      prevX = x;
      prevY = y;
    } else {
      dispatch("close");
    }
  });

  $: level = !ctx ? 1 : 2;
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
    if (
      target &&
      target.closest('[tabindex]') &&
      target.closest('[tabindex]').getAttribute('role') === 'menuitem'
    ) {
      return;
    }
    close();
  }}"
  on:keydown
  on:keydown="{(e) => {
    // TODO: add focus logic
  }}"
>
  <slot />
</ul>
