<script>
  /**
   * Set the size of list box
   * @type {"sm" | "xl"} [size]
   */
  export let size = undefined;

  /**
   * Set the type of list box
   * @type {"default" | "inline"} [type="default"]
   */
  export let type = "default";

  export let open = false;

  /**
   * Set to `true` to enable the light variant
   * @type {boolean} [light=false]
   */
  export let light = false;
  export let disabled = false;
  export let invalid = false;
  export let invalidText = "";
</script>

<div
  role="listbox"
  tabindex="-1"
  data-invalid={invalid || undefined}
  class:bx--list-box={true}
  class:bx--list-box--inline={type === 'inline'}
  class:bx--list-box--disabled={disabled}
  class:bx--list-box--expanded={open}
  class:bx--list-box--light={light}
  {...$$restProps}
  class="{size && `bx--list-box--${size}`}
  {$$restProps.class}"
  on:keydown
  on:keydown={(e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
    }
  }}
  on:click|preventDefault|stopPropagation>
  <slot />
</div>
{#if invalid}
  <div class:bx--form-requirement={true}>{invalidText}</div>
{/if}
