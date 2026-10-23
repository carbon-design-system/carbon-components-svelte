<script>
  /** @extends {"../Button/Button.svelte"} ButtonProps */

  import { getContext } from "svelte";
  import Button from "../Button/Button.svelte";
  import { joinDescribedBy } from "../utils/field-status.js";

  // Inside a `Callout`, the callout's title describes the action.
  const calloutDescribedBy = getContext("carbon:Callout")?.describedBy;
  // As in Carbon React, a toast's action is a tertiary button, not a ghost.
  const toast = getContext("carbon:ToastNotification") !== undefined;
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
    $calloutDescribedBy,
    $$restProps["aria-describedby"],
  )}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <slot />
</Button>
