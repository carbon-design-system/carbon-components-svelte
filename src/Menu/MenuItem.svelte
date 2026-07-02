<script>
  /**
   * @event {MouseEvent} click
   */

  /** Set to `true` to disable the item */
  export let disabled = false;

  /**
   * Obtain a reference to the list item HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, getContext } from "svelte";

  const dispatch = createEventDispatcher();
  const ctx = getContext("carbon:Menu");

  function handleClick(event) {
    if (disabled) return;

    const shouldContinue = dispatch("click", event, { cancelable: true });

    if (shouldContinue) {
      ctx.close("select");
    }
  }
</script>

<li
  bind:this={ref}
  role="menuitem"
  tabindex="-1"
  aria-disabled={disabled}
  class:bx--menu-option={true}
  class:bx--menu-option--disabled={disabled}
  {...$$restProps}
  on:keydown
  on:keydown={(event) => {
    if (disabled) return;
    if (event.key === " " || event.key === "Enter") handleClick(event);
  }}
  on:click={handleClick}
>
  <div
    class:bx--menu-option__content={true}
    class:bx--menu-option__content--disabled={disabled}
  >
    <span class:bx--menu-option__label={true}>
      <slot />
    </span>
  </div>
</li>
