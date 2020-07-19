<script>
  export let text = "Provide text";
  export let selected = false;
  export let disabled = false;
  export let id = "ccs-" + Math.random().toString(36);
  export let ref = null;

  import { afterUpdate, getContext, onDestroy } from "svelte";

  const ctx = getContext("ContentSwitcher");

  ctx.add({ id, text, selected });

  const unsubscribe = ctx.currentId.subscribe($ => {
    selected = $ === id;
  });

  afterUpdate(() => {
    if (selected) {
      ref.focus();
    }
  });

  onDestroy(() => {
    unsubscribe();
  });
</script>

<button
  bind:this={ref}
  role="tab"
  tabindex={selected ? '0' : '-1'}
  aria-selected={selected}
  {disabled}
  {id}
  class:bx--content-switcher-btn={true}
  class:bx--content-switcher--selected={selected}
  {...$$restProps}
  on:click
  on:click|preventDefault={() => {
    ctx.update(id);
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown
  on:keydown={({ key }) => {
    if (key === 'ArrowRight') {
      ctx.change(1);
    } else if (key === 'ArrowLeft') {
      ctx.change(-1);
    }
  }}>

  <span class:bx--content-switcher__label={true}>
    <slot>{text}</slot>
  </span>
</button>
