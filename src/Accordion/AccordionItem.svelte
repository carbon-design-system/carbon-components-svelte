<script>
  export let title = "title";
  export let open = false;
  export let iconDescription = "Expand/Collapse";

  import ChevronRight16 from "carbon-icons-svelte/lib/ChevronRight16";

  $: animation = undefined;
</script>

<li
  class:bx--accordion__item={true}
  class:bx--accordion__item--active={open}
  class="bx--accordion__item--${animation}"
  {...$$restProps}
  on:animationend
  on:animationend={() => {
    animation = undefined;
  }}>
  <button
    type="button"
    class:bx--accordion__heading={true}
    title={iconDescription}
    aria-expanded={open}
    on:click
    on:click={() => {
      open = !open;
      animation = open ? 'expanding' : 'collapsing';
    }}
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keydown
    on:keydown={({ key }) => {
      if (open && key === 'Escape') {
        open = false;
      }
    }}>
    <ChevronRight16 class="bx--accordion__arrow" aria-label={iconDescription} />
    <div class="bx--accordion__title">
      <slot name="title">{title}</slot>
    </div>
  </button>
  <div class="bx--accordion__content">
    <slot />
  </div>
</li>
