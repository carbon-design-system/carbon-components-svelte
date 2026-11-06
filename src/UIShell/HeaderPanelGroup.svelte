<script>
  /**
   * @slot {{}} labelChildren
   */

  /**
   * Specify the group label.
   * Alternatively, use the "labelChildren" slot.
   */
  export let label = "";

  import { useId } from "../utils/id-scope.js";

  const labelId = useId("header-panel-group", "ccs-header-panel-group");
</script>

<!--
  A labelled group of `HeaderPanelLink`s inside `HeaderPanelLinks`.
  The visible label is `aria-hidden` and names the nested list through
  `aria-labelledby`, so screen readers announce it once, as the list name.
  The rule is decorative, so it is hidden too.
-->
<li class:bx--header-panel-group={true}>
  {#if label || $$slots.labelChildren}
    <div id={labelId} aria-hidden="true" class:bx--header-panel-divider={true}>
      <slot name="labelChildren">{label}</slot>
    </div>
  {/if}
  <hr aria-hidden="true" class:bx--switcher__item--divider={true} />
  <ul
    aria-labelledby={label || $$slots.labelChildren ? labelId : undefined}
    class:bx--header-panel-group__list={true}
  >
    <slot />
  </ul>
</li>
