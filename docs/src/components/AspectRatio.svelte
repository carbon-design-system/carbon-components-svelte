<script>
  /**
   * @type {"2x1" | "16x9" | "4x3" | "1x1" | "3x4" | "9x16" | "1x2"}
   */
  export let ratio = "2x1";
</script>

<div
  {...$$restProps}
  class:bx--aspect-ratio="{true}"
  class="bx--aspect-ratio--{ratio} {$$restProps.class}"
>
  <div class:bx--aspect-ratio--object="{true}">
    <slot />
  </div>
</div>
