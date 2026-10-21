<script>
  /** @extends {"../Button/Button.svelte"} ButtonProps */

  import { getContext } from "svelte";
  import Button from "../Button/Button.svelte";
  import { joinDescribedBy } from "../utils/field-status.js";

  // Inside a `Callout`, the callout's title describes the action.
  const calloutDescribedBy = getContext("carbon:Callout")?.describedBy;
</script>

<Button
  kind="ghost"
  size="small"
  {...$$restProps}
  class={["bx--inline-notification__action-button", $$restProps.class]
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
