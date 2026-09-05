<script>
  /** @restProps {figure} */

  /**
   * Specify the size of the big number.
   * @type {"default" | "lg" | "xl"}
   */
  export let size = "default";

  import SkeletonText from "../SkeletonText/SkeletonText.svelte";
</script>

<figure
  class:bx--big-number={true}
  class:bx--big-number--lg={size === "lg"}
  class:bx--big-number--xl={size === "xl"}
  class:bx--skeleton={true}
  {...$$restProps}
>
  <figcaption class:bx--big-number__label={true}>
    <SkeletonText width="40%" />
  </figcaption>
  <div class:bx--big-number__value-row={true}>
    <SkeletonText width="60%" heading />
  </div>
</figure>
