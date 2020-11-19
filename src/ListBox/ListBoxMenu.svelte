<script>
  /** Set an id for the top-level element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Obtain a reference to the HTML element */
  export let ref = null;
</script>

<div
  bind:this="{ref}"
  role="listbox"
  id="menu-{id}"
  class:bx--list-box__menu="{true}"
  {...$$restProps}
  on:scroll
>
  <slot />
</div>
