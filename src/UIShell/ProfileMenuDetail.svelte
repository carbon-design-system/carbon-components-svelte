<script>
  import { uniqueId } from "../utils/unique-id.js";

  /**
   * Specify the label describing the value (for example, "Plan" or "Location").
   * @type {string}
   */
  export let label = undefined;

  /**
   * Set an id for the top-level element.
   * The label id derives from it as `{id}-label`.
   */
  export let id = uniqueId();
</script>

<div {id} class:bx--profile-menu__detail={true}>
  <div class:bx--profile-menu__detail-text={true}>
    <span id="{id}-label" class:bx--profile-menu__detail-label={true}
      >{label}</span
    >
    <span
      aria-labelledby="{id}-label"
      class:bx--profile-menu__detail-value={true}
    >
      <slot />
    </span>
  </div>
  {#if $$slots.action}
    <span class:bx--profile-menu__detail-action={true}>
      <slot name="action" />
    </span>
  {/if}
</div>
