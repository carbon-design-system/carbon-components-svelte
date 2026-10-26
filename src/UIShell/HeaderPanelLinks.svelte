<script>
  /**
   * @restProps {ul}
   */

  import { verticalListFocus } from "../utils/vertical-list-focus.js";
</script>

<!-- Mirrors Carbon React's `Switcher`: arrows wrap, Home/End jump to the ends. -->
<ul
  use:verticalListFocus={{
    selector: ".bx--switcher__item-link",
    // A link without `href` renders as a button, which can be disabled.
    isDisabled: (link) =>
      /** @type {HTMLButtonElement} */ (link).disabled === true,
  }}
  class:bx--switcher__item={true}
  {...$$restProps}
>
  <slot />
</ul>
