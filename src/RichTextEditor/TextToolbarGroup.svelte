<script>
  /**
   * @restProps {div}
   */

  /**
   * Specify an accessible label for the group of controls.
   * @type {string}
   */
  export let labelText = undefined;
</script>

<div
  role="group"
  aria-label={labelText}
  class:bx--text-toolbar__group={true}
  {...$$restProps}
>
  <slot />
</div>
