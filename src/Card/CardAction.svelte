<script>
  /**
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * Set to `true` when wrapping an icon-only button in a `CardFooter` with
   * `actionSet`. Fixes the action's width instead of stretching it to fill
   * the row.
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
