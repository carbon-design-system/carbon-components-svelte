<script>
  export let tooltipText = "";
  export let align = "center"; // "start" | "center" | "end"
  export let direction = "bottom"; // "top" | "right" | "bottom" | "left"
  export let id = "ccs-" + Math.random().toString(36);
  export let ref = null;

  $: hidden = false;
</script>

<svelte:body
  on:keydown={({ key }) => {
    if (key === 'Escape') {
      hidden = true;
    }
  }} />

<button
  bind:this={ref}
  aria-describedby={id}
  class:bx--tooltip__trigger={true}
  class:bx--tooltip--a11y={true}
  class:bx--tooltip--hidden={hidden}
  {...$$restProps}
  class="{direction && `bx--tooltip--${direction}`}
  {align && `bx--tooltip--align-${align}`}
  {$$restProps.class}"
  on:click
  on:mouseover
  on:mouseenter
  on:mouseenter={() => {
    hidden = false;
  }}
  on:mouseleave
  on:focus
  on:focus={() => {
    hidden = false;
  }}>
  <span {id} class:bx--assistive-text={true}>{tooltipText}</span>
  <slot />
</button>
