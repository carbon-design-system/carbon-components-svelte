<script>
  /**
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * An action that holds an icon-only button or an OverflowMenu keeps
   * its width at the inline end of the footer, instead of stretching to
   * fill the row. The card now detects that itself.
   * @deprecated The card detects an icon-only control. Remove the prop.
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
