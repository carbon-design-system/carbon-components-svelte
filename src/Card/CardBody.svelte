<script>
  /**
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * Set to `true` to remove the body's padding, for content with its own
   * spacing, such as a table, a chart or an image. Named `noPadding` as on
   * `Tile`; Carbon React calls it `isFlush`.
   */
  export let noPadding = false;
</script>

<div
  class:bx--card__body={true}
  class:bx--card__body--no-padding={noPadding}
  {...$$restProps}
>
  <slot />
</div>
