<script>
  /**
   * Internal. The scroll spacer and the rendered window of a virtualized list,
   * shared by `VirtualList` and the listbox menus.
   */

  /** The height of the whole list in pixels. */
  export let totalHeight = 0;

  /** Where the first rendered row sits in the list, in pixels. */
  export let offsetY = 0;

  /** The scroll position the window was resolved against. */
  export let scrollTop = 0;

  /**
   * Set to `true` to pin the window to the viewport, so a scroll it has not
   * caught up with shows the rows already rendered instead of blank space.
   */
  export let pinned = false;

  /**
   * Set to `true` when row heights are measured rather than known, so a
   * rendered row can be taller than `totalHeight` assumed.
   */
  export let measured = false;

  import { tick } from "svelte";
  import { virtualWindow } from "../utils/virtual-window.js";

  /** @type {null | HTMLDivElement} */
  let spacerRef = null;
  /** @type {null | HTMLDivElement} */
  let layerRef = null;
  /** Whether the spacer carries a stretch that may need clearing. */
  let stretched = false;

  /**
   * Measured rows can render taller than `totalHeight` assumed, before their
   * heights are known. An unpinned window's overflow stretches the scroll
   * range to reach them. A pinned layer's overflow does not, so stretch the
   * spacer to the rendered rows instead. Rows of known height never outgrow
   * `totalHeight`, so a fixed-height window reads no geometry: the read
   * forces a layout on every scroll. The height measurer observes measured
   * rows, so a row that resizes changes `totalHeight` and stretches again.
   */
  function stretchSpacer() {
    if (!spacerRef) return;

    const last = pinned && measured ? layerRef?.lastElementChild : null;
    const minHeight =
      last instanceof HTMLElement
        ? offsetY + last.offsetTop + last.offsetHeight
        : 0;
    spacerRef.style.minHeight = minHeight > 0 ? `${minHeight}px` : "";
    stretched = minHeight > 0;
  }

  /**
   * Stretch the spacer once the parent's keyed `{#each}` has patched the rows.
   * The arguments are the inputs that move the window, so the `$:` below runs
   * again whenever one of them changes.
   *
   * @param {number} _offsetY
   * @param {number} _totalHeight
   * @param {number} _scrollTop
   */
  function queueStretch(_offsetY, _totalHeight, _scrollTop) {
    tick().then(stretchSpacer);
  }

  $: if ((pinned && measured) || stretched) {
    queueStretch(offsetY, totalHeight, scrollTop);
  }
</script>

<div
  bind:this={spacerRef}
  style:height="{totalHeight}px"
  style:position="relative"
>
  <div bind:this={layerRef} use:virtualWindow={{ offsetY, scrollTop, pinned }}>
    <slot />
  </div>
</div>
