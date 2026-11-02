<script>
  /**
   * @restProps {div}
   * @slot {{}}
   * @slot {{}} actions - A `CardActions` with quick actions, in the top inline-end corner. The title leaves room for them.
   */
</script>

<div class:bx--card__header={true} {...$$restProps}>
  <slot />
  <slot name="actions" />
</div>
