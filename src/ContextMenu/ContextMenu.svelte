<script>
  import ContextMenuInner from "./ContextMenuInner.svelte";

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

  import { getContext } from "svelte";

  const ctx = getContext("ContextMenu");

  let level;
  $: level = !ctx ? 1 : 2;

  function close() {
    open = false;
    x = 0;
    y = 0;
  }

  function onContextMenu(e) {
    if (level > 1) return;
    open = true;
    x = e.x;
    y = e.y;
  }
</script>

<svelte:window
  on:contextmenu|preventDefault="{onContextMenu}"
  on:click="{(e) => {
    if (!open) return;
    if (e.target.contains(ref)) close();
  }}"
  on:keydown="{(e) => {
    if (open && e.key === 'Escape') close();
  }}"
/>

<ContextMenuInner bind:open bind:ref x="{x}" y="{y}">
  <slot />
</ContextMenuInner>
