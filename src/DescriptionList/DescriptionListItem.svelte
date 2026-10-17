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

  /**
   * Set to `true` to show the item as a total: ruled off from the items
   * above, with a larger detail. Use it in a `layout="summary"` list.
   */
  export let total = false;
</script>

<div
  class:bx--description-list-item={true}
  class:bx--description-list-item--total={total}
  {...$$restProps}
>
  <dt class:bx--type-label-01={true}>{term ?? ""}</dt>
  <dd class:bx--type-body-short-01={true}>
    <slot />
  </dd>
</div>
