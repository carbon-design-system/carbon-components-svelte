<script>
  /** @restProps {figure} */

  /**
   * Specify the size of the big number.
   * @type {"default" | "lg" | "xl"}
   */
  export let size = "default";
</script>

<figure
  class:bx--big-number={true}
  class:bx--big-number--lg={size === "lg"}
  class:bx--big-number--xl={size === "xl"}
  class:bx--skeleton={true}
  {...$$restProps}
>
  <!-- Each row keeps a line of its own type (a non-breaking space), so the
       skeleton is the big number's height at every size; the bar sits in
       that line. -->
  <figcaption class:bx--big-number__label={true}>
    <span
      class:bx--big-number__skeleton-bar={true}
      class:bx--big-number__skeleton-bar--label={true}
    ></span>&nbsp;
  </figcaption>
  <div class:bx--big-number__value-row={true}>
    <span class:bx--big-number__skeleton-bar={true}></span>&nbsp;
  </div>
</figure>
