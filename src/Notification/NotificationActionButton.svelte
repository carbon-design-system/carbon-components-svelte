<script>
  import { Button } from "../Button";
</script>

<Button
  kind="ghost"
  size="small"
  class="bx--inline-notification__action-button"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</Button>
