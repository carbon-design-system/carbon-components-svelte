<script>
  /**
   * A non-option row after a list box menu's options, for status such as an
   * empty filter result or loading. Rendered outside any virtual window and
   * hidden from assistive tech: the menu's owner announces the same status
   * through its live region or `aria-busy`, and a listbox exposes only
   * options and groups.
   */
</script>

<div
  role="presentation"
  aria-hidden="true"
  class:bx--list-box__menu-status={true}
  on:mousedown={(event) => {
    // Keep focus on the field, as options do.
    event.preventDefault();
  }}
>
  <slot />
</div>
