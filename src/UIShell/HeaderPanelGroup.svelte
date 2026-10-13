<script>
  /**
   * @slot {{}} label
   */

  /**
   * Specify the group label.
   * Alternatively, use the "label" slot.
   */
  export let label = "";

  import { uniqueId } from "../utils/unique-id.js";

  const labelId = uniqueId("ccs-header-panel-group");
</script>

<!--
  A labelled group of `HeaderPanelLink`s inside `HeaderPanelLinks`.
  The visible label is `aria-hidden` and names the nested list through
  `aria-labelledby`, so screen readers announce it once, as the list name.
  The rule is decorative, so it is hidden too.
-->
<li class:bx--header-panel-group={true}>
  {#if label || $$slots.label}
    <div id={labelId} aria-hidden="true" class:bx--header-panel-divider={true}>
      <slot name="label">{label}</slot>
    </div>
  {/if}
  <hr aria-hidden="true" class:bx--switcher__item--divider={true}>
  <ul
    aria-labelledby={label || $$slots.label ? labelId : undefined}
    class:bx--header-panel-group__list={true}
  >
    <slot />
  </ul>
</li>
