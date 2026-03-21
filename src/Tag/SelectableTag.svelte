<script>
  /**
   * @generics {Icon = any} Icon
   * @restProps {button}
   * @event {{ selected: boolean }} "change"
   */

  /** Set to `true` to select the tag */
  export let selected = false;

  /**
   * Specify the type of tag.
   * @type {"red" | "magenta" | "purple" | "blue" | "cyan" | "teal" | "green" | "gray" | "cool-gray" | "warm-gray" | "high-contrast" | "outline"}
   */
  export let type = undefined;

  /** @type {"sm" | "default"} */
  export let size = "default";

  /** Set to `true` to disable the tag */
  export let disabled = false;

  /**
   * Specify the icon to render.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /** Set an id for the tag */
  export let id = `ccs-${Math.random().toString(36)}`;

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  function toggle() {
    if (disabled) return;
    selected = !selected;
    dispatch("change", { selected });
  }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<button
  type="button"
  role="checkbox"
  aria-checked={selected}
  {id}
  {disabled}
  aria-disabled={disabled}
  tabindex={disabled ? "-1" : undefined}
  class:bx--tag={true}
  class:bx--tag--selectable={true}
  class:bx--tag--selectable-selected={selected}
  class:bx--tag--disabled={disabled}
  class:bx--tag--sm={size === "sm"}
  class:bx--tag--red={type === "red"}
  class:bx--tag--magenta={type === "magenta"}
  class:bx--tag--purple={type === "purple"}
  class:bx--tag--blue={type === "blue"}
  class:bx--tag--cyan={type === "cyan"}
  class:bx--tag--teal={type === "teal"}
  class:bx--tag--green={type === "green"}
  class:bx--tag--gray={type === "gray"}
  class:bx--tag--cool-gray={type === "cool-gray"}
  class:bx--tag--warm-gray={type === "warm-gray"}
  class:bx--tag--high-contrast={type === "high-contrast"}
  class:bx--tag--outline={type === "outline"}
  {...$$restProps}
  on:click
  on:click={toggle}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown
>
  {#if $$slots.icon || icon}
    <div class:bx--tag__custom-icon={true}>
      <slot name="icon"> <svelte:component this={icon} /> </slot>
    </div>
  {/if}
  <span> <slot /> </span>
</button>
