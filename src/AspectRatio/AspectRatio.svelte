<script>
  /**
   * Specify the ratio to be used by the aspect ratio container.
   * This will determine what aspect ratio your content will be displayed in.
   * @type {"2x1" | "2x3" | "16x9" | "4x3" | "1x1" | "3x4" | "3x2" | "9x16" | "1x2"}
   */
  export let ratio = "2x1";
</script>

<div class="{`bx--aspect-ratio bx--aspect-ratio--${ratio}`}" {...$$restProps}>
  <slot />
</div>
