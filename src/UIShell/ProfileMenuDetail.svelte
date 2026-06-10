<script>
  /**
   * Specify the label describing the value (for example, "Plan" or "Location").
   * @type {string}
   */
  export let label = undefined;

  const id = `ccs-${Math.random().toString(36)}`;
</script>

<div class:bx--profile-menu__detail={true}>
  <div class:bx--profile-menu__detail-text={true}>
    <span {id} class:bx--profile-menu__detail-label={true}>{label}</span>
    <span aria-labelledby={id} class:bx--profile-menu__detail-value={true}>
      <slot />
    </span>
  </div>
  {#if $$slots.action}
    <span class:bx--profile-menu__detail-action={true}>
      <slot name="action" />
    </span>
  {/if}
</div>
