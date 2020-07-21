<script>
  export let size = undefined; // "sm" | "xl"
  export let type = "default"; // "default" | "inline"
  export let open = false;
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
  on:keydown={e => {
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
