<script>
  /**
   * @restProps {li}
   * @slot {{}} - The label, such as a day.
   */
</script>

<li class:bx--chat-divider={true} {...$$restProps}>
  <span class:bx--chat-divider__label={true}><slot /></span>
</li>
