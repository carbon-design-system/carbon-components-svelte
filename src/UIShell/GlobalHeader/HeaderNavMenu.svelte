<script>
  /**
   * Set to `true` to toggle the expanded state
   * @type {boolean} [expanded=false]
   */
  export let expanded = false;

  /**
   * Specify the `href` attribute
   * @type {string} [href="/"]
   */
  export let href = "/";

  /**
   * Specify the text
   * @type {string} [text]
   */
  export let text = undefined;

  /**
   * Specify the ARIA label for the chevron icon
   * @type {string} [iconDescription="Expand/Collapse"]
   */
  export let iconDescription = "Expand/Collapse";

  import ChevronDown16 from "carbon-icons-svelte/lib/ChevronDown16";

  let ref = null;
</script>

<svelte:window
  on:mouseup={({ target }) => {
    if (ref.contains(target) || target === ref) {
      expanded = !expanded;
    } else {
      if (expanded) {
        expanded = false;
      }
    }
  }} />

<li class:bx--header__submenu={true} title={iconDescription}>
  <a
    bind:this={ref}
    role="menuitem"
    tabindex="0"
    aria-haspopup="menu"
    aria-expanded={expanded}
    aria-label={text}
    {href}
    class:bx--header__menu-item={true}
    class:bx--header__menu-title={true}
    {...$$restProps}
    on:keydown
    on:keydown={({ key }) => {
      if (key === 'Enter') {
        expanded = !expanded;
      }
    }}
    on:click|preventDefault
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keyup
    on:focus
    on:blur>
    {text}
    <ChevronDown16
      aria-label={iconDescription}
      class="bx--header__menu-arrow" />
  </a>
  <ul role="menu" aria-label={text} class:bx--header__menu={true}>
    <slot />
  </ul>
</li>
