<script>
  /**
   * Specify the switch text
   * Alternatively, use the "text" slot  (e.g., <span slot="text">...</span>)
   */
  export let text = "Provide text";

  /** Set to `true` for the switch to be selected */
  export let selected = false;

  /** Set to `true` to disable the switch */
  export let disabled = false;

  /** Set an id for the button element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Obtain a reference to the button HTML element */
  export let ref = null;

  import { afterUpdate, getContext, onMount } from "svelte";

  const ctx = getContext("ContentSwitcher");

  ctx.add({ id, text, selected });

  const unsubscribe = ctx.currentId.subscribe(($) => {
    selected = $ === id;
  });

  afterUpdate(() => {
    if (selected) {
      ref.focus();
    }
  });

  onMount(() => {
    return () => unsubscribe();
  });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<button
  bind:this="{ref}"
  type="button"
  role="tab"
  tabindex="{selected ? '0' : '-1'}"
  aria-selected="{selected}"
  disabled="{disabled}"
  id="{id}"
  class:bx--content-switcher-btn="{true}"
  class:bx--content-switcher--selected="{selected}"
  {...$$restProps}
  on:click
  on:click|preventDefault="{() => {
    ctx.update(id);
  }}"
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown
  on:keydown="{({ key }) => {
    if (key === 'ArrowRight') {
      ctx.change(1);
    } else if (key === 'ArrowLeft') {
      ctx.change(-1);
    }
  }}"
>
  <span class:bx--content-switcher__label="{true}">
    <slot>{text}</slot>
  </span>
</button>
