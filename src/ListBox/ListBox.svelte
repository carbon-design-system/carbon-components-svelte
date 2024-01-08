<script>
  /**
   * Set the size of the list box
   * @type {"sm" | "lg" }
   */
  export let size = undefined;

  /**
   * Set the type of the list box
   * @type {"default" | "inline"}
   */
  export let type = "default";

  /** Set to `true` to open the list box */
  export let open = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the list box */
  export let disabled = false;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate an warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";
</script>

<div
  role="listbox"
  tabindex="-1"
  data-invalid="{invalid || undefined}"
  class:cds--list-box="{true}"
  class:cds--list-box--sm="{size === 'sm'}"
  class:cds--list-box--lg="{size === 'lg' || size === 'xl'}"
  class:cds--list-box--inline="{type === 'inline'}"
  class:cds--list-box--disabled="{disabled}"
  class:cds--list-box--expanded="{open}"
  class:cds--list-box--light="{light}"
  class:cds--list-box--warning="{!invalid && warn}"
  {...$$restProps}
  on:keydown
  on:keydown="{(e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
    }
  }}"
  on:click|preventDefault
>
  <slot />
</div>
{#if invalid}
  <div class:cds--form-requirement="{true}">{invalidText}</div>
{/if}
{#if !invalid && warn}
  <div class:cds--form-requirement="{true}">{warnText}</div>
{/if}
