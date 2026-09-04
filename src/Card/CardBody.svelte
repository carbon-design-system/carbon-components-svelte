<script>
  /**
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * Set to `true` to remove body padding, for content that manages its own
   * spacing (for example a table, chart, or image).
   */
  export let isFlush = false;
</script>

<div
  class:bx--card__body={true}
  class:bx--card__body--flush={isFlush}
  {...$$restProps}
>
  <slot />
</div>
