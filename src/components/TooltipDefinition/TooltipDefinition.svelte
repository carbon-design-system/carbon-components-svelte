<script>
  export let tooltipText = "";
  export let align = "center"; // "start" | "center" | "end"
  export let direction = "bottom"; // "top" | "bottom"
  export let id = "ccs-" + Math.random().toString(36);
  export let ref = null;

  $: hidden = false;
  $: visible = false;
</script>

<svelte:body
  on:keydown={e => {
    if (e.key === 'Escape') {
      hidden = true;
    }
  }} />

<div
  class:bx--tooltip--definition={true}
  class:bx--tooltip--a11y={true}
  {...$$restProps}
  on:mouseenter={() => {
    hidden = false;
    visible = true;
  }}
  on:mouseleave={() => {
    visible = false;
  }}>
  <button
    bind:this={ref}
    aria-describedby={id}
    class:bx--tooltip--a11y={true}
    class:bx--tooltip__trigger={true}
    class:bx--tooltip__trigger--definition={true}
    class:bx--tooltip--hidden={hidden}
    class:bx--tooltip--visible={visible}
    class="{direction && `bx--tooltip--${direction}`}
    {align && `bx--tooltip--align-${align}`}"
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:focus
    on:focus={() => {
      hidden = false;
    }}>
    <slot />
  </button>
  <div role="tooltip" {id} class:bx--assistive-text={true}>{tooltipText}</div>
</div>
