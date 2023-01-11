<script>
  /** @extends {"../Button/Button.svelte"} ButtonProps */

  import Button from "../Button/Button.svelte";
</script>

<Button
  kind="ghost"
  size="small"
  {...$$restProps}
  class="bx--inline-notification__action-button {$$restProps.class}"
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</Button>
