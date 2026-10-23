<script>
  /**
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * Set to `true` when the action is an icon-only button in a
   * `CardFooter` with `actionSet`. It keeps its width and moves to the
   * inline end, instead of stretching to fill the row.
   */
  export let iconOnly = false;
</script>

<div
  class:bx--card__action={true}
  class:bx--card__action--icon-only={iconOnly}
  {...$$restProps}
>
  <slot />
</div>
