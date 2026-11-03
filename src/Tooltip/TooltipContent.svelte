<script>
  /**
   * Internal. The caret and content of a `Tooltip`, shared by its in-place and
   * portalled roots, animated or not.
   */

  /** Specify the id of the trigger that names the content. */
  export let triggerId = "";

  /** Specify how far the tooltip slid to stay in the window, in pixels. */
  export let shift = 0;
</script>

<span
  class:bx--tooltip__caret={true}
  style:left={shift ? `${-shift}px` : undefined}
  style:right={shift ? `${shift}px` : undefined}
></span>
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
  on:click|stopPropagation
  on:mousedown|stopPropagation
  class:bx--tooltip__content={true}
  tabindex="-1"
  role="dialog"
  aria-labelledby={triggerId}
>
  <slot />
</div>
