<script>
  /**
   * @restProps {div}
   * @slot {{}}
   * @slot {{}} term - Term content, such as text with a Toggletip or a link. Overrides the `term` prop.
   */

  /**
   * Specify the term text, rendered inside `<dt>`.
   * Use the `term` slot for richer content.
   * The default slot renders the detail inside `<dd>`.
   * @type {string | undefined}
   */
  export let term = undefined;

  /**
   * Set to `true` to show the item as a total: ruled off from the items
   * above, with a larger detail. Use it in a `layout="summary"` list.
   */
  export let total = false;

  /**
   * Set to `true` to rule the item off from the items above without
   * enlarging it, such as to start a "Taxes and fees" section.
   */
  export let divider = false;
</script>

<div
  class:bx--description-list-item={true}
  class:bx--description-list-item--divider={divider}
  class:bx--description-list-item--total={total}
  {...$$restProps}
>
  <dt class:bx--type-label-01={true}><slot name="term">{term ?? ""}</slot></dt>
  <dd class:bx--type-body-short-01={true}>
    <slot />
  </dd>
</div>
