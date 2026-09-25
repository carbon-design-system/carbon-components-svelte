<script>
  /**
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * Specify the term text, rendered inside `<dt>`.
   * The default slot renders the detail inside `<dd>`.
   * @type {string | undefined}
   */
  export let term = undefined;
</script>

<div class:bx--description-list-item={true} {...$$restProps}>
  <dt class:bx--type-label-01={true}>{term ?? ""}</dt>
  <dd class:bx--type-body-short-01={true}>
    <slot />
  </dd>
</div>
