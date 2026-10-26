<script>
  /** @extendProps {"../Button/Button.svelte"} ButtonProps */

  import { getContext } from "svelte";
  import Button from "../Button/Button.svelte";
  import { joinDescribedBy } from "../utils/field-status.js";

  // The notification's title describes the action, so focusing it reads
  // "Retry, button, Upload failed". As in Carbon React, a toast's action is
  // a tertiary button, not a ghost.
  const { describedBy, toast } = getContext("carbon:NotificationAction") ?? {};
</script>

<Button
  kind={toast ? "tertiary" : "ghost"}
  size="small"
  {...$$restProps}
  class={[
    toast
      ? "bx--toast-notification__action-button"
      : "bx--inline-notification__action-button",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ")}
  aria-describedby={joinDescribedBy(
    $describedBy,
    $$restProps["aria-describedby"],
  )}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</Button>
