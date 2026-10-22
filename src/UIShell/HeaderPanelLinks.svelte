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
    isDisabled: (link) => link.disabled === true,
  }}
  class:bx--switcher__item={true}
  {...$$restProps}
>
  <slot />
</ul>
