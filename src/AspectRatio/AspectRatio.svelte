<script>
  /**
   * Specify the aspect ratio
   * @type {"2x1" | "2x3" | "16x9" | "4x3" | "1x1" | "3x4" | "3x2" | "9x16" | "1x2"}
   */
  export let ratio = "2x1";
</script>

<div
  class:cds--aspect-ratio="{true}"
  class:cds--aspect-ratio--2x1="{ratio === '2x1'}"
  class:cds--aspect-ratio--2x3="{ratio === '2x3'}"
  class:cds--aspect-ratio--16x9="{ratio === '16x9'}"
  class:cds--aspect-ratio--4x3="{ratio === '4x3'}"
  class:cds--aspect-ratio--1x1="{ratio === '1x1'}"
  class:cds--aspect-ratio--3x4="{ratio === '3x4'}"
  class:cds--aspect-ratio--3x2="{ratio === '3x2'}"
  class:cds--aspect-ratio--9x16="{ratio === '9x16'}"
  class:cds--aspect-ratio--1x2="{ratio === '1x2'}"
  {...$$restProps}
>
  <slot />
</div>
