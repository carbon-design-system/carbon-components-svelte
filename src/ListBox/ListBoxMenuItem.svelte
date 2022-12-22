<script>
  /** Set to `true` to enable the active state */
  export let active = false;

  /** Set to `true` to enable the highlighted state */
  export let highlighted = false;

  /** Set to `true` to disable the menu item */
  export let disabled = false;

  let ref = null;

  $: isTruncated = ref?.offsetWidth < ref?.scrollWidth;
  $: title = isTruncated ? ref?.innerText : undefined;
  $: if (highlighted && ref && !ref.matches(":hover")) {
    // Scroll highlighted item into view if using keyboard navigation
    ref.scrollIntoView({ block: "nearest" });
  }
</script>

<div
  role="option"
  class:bx--list-box__menu-item="{true}"
  class:bx--list-box__menu-item--active="{active}"
  class:bx--list-box__menu-item--highlighted="{highlighted || active}"
  aria-selected="{active}"
  disabled="{disabled ? true : undefined}"
  {...$$restProps}
  on:click
  on:mouseenter
  on:mouseleave
>
  <div
    bind:this="{ref}"
    title="{title}"
    class:bx--list-box__menu-item__option="{true}"
  >
    <slot />
  </div>
</div>
