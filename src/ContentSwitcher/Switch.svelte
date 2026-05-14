<script>
  /**
   * Specify the switch text.
   * Alternatively, use the default slot.
   * @example
   * ```svelte
   * <Switch>
   *   <span>Custom Text</span>
   * </Switch>
   * ```
   */
  export let text = "Provide text";

  /** Set to `true` for the switch to be selected */
  export let selected = false;

  /** Set to `true` to disable the switch */
  export let disabled = false;

  /** Set an id for the button element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /** Obtain a reference to the button HTML element */
  export let ref = null;

  import { getContext, onMount } from "svelte";

  const ctx = getContext("carbon:ContentSwitcher");

  ctx.add({ id, text, selected });

  const unsubscribe = ctx.currentId.subscribe((currentId) => {
    selected = currentId === id;
  });

  onMount(() => {
    return () => {
      ctx.remove(id);
      unsubscribe();
    };
  });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<button
  bind:this={ref}
  type="button"
  role="tab"
  tabindex={selected ? "0" : "-1"}
  aria-selected={selected}
  {disabled}
  {id}
  class:bx--content-switcher-btn={true}
  class:bx--content-switcher--selected={selected}
  {...$$restProps}
  on:click
  on:click={() => {
    ctx.update(id);
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:focus
  on:blur
  on:keyup
  on:keydown
  on:keydown={(e) => {
    if (e.key === "ArrowRight") {
      ctx.selectionMode === "manual" ? ctx.focus(1) : ctx.change(1);
    } else if (e.key === "ArrowLeft") {
      ctx.selectionMode === "manual" ? ctx.focus(-1) : ctx.change(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      ctx.selectionMode === "manual" ? ctx.focusTo(0) : ctx.changeTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      const last = ctx.switchCount - 1;
      ctx.selectionMode === "manual" ? ctx.focusTo(last) : ctx.changeTo(last);
    }
  }}
>
  <span class:bx--content-switcher__label={true}> <slot>{text}</slot> </span>
</button>
