<script>
  /**
   * @restProps {div}
   */

  /** Specify the element tag */
  export let tag = "div";

  /** Set to `true` to use the condensed variant */
  export let condensed = false;

  /** Set to `true` to use the narrow variant */
  export let narrow = false;

  /** Set to `true` to use the fullWidth variant */
  export let fullWidth = false;

  /** Set to `true` to remove the gutter */
  export let noGutter = false;

  /** Set to `true` to remove the left gutter */
  export let noGutterLeft = false;

  /** Set to `true` to remove the right gutter */
  export let noGutterRight = false;

  /** Set to `true` to add top and bottom padding to all columns */
  export let padding = false;
</script>

<svelte:element
  this="{tag}"
  class:bx--grid="{true}"
  class:bx--grid--condensed="{condensed}"
  class:bx--grid--narrow="{narrow}"
  class:bx--grid--full-width="{fullWidth}"
  class:bx--no-gutter="{noGutter}"
  class:bx--no-gutter--left="{noGutterLeft}"
  class:bx--no-gutter--right="{noGutterRight}"
  class:bx--row-padding="{padding}"
  {...$$restProps}
>
  <slot />
</svelte:element>
