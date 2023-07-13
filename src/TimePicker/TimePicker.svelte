<script>
  /**
   * Specify the size of the input
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /**
   * Specify the input value
   * @type {string}
   */
  export let value = "";

  /** Specify the input placeholder text */
  export let placeholder = "hh:mm";

  /** Specify the `pattern` attribute for the input element */
  export let pattern = "(1[012]|[1-9]):[0-5][0-9](\\s)?";

  /** Specify the `maxlength` input attribute */
  export let maxlength = 5;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the input
   * @type {string}
   */
  export let name = undefined;

  /** Obtain a reference to the input HTML element */
  export let ref = null;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item="{true}"
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div
    class:bx--time-picker="{true}"
    class:bx--time-picker--light="{light}"
    class:bx--time-picker--invalid="{invalid}"
    class:bx--time-picker--sm="{size === 'sm'}"
    class:bx--time-picker--xl="{size === 'xl'}"
    class:bx--select--light="{light}"
  >
    <div class:bx--time-picker__input="{true}">
      {#if labelText || $$slots.labelText}
        <label
          for="{id}"
          class:bx--label="{true}"
          class:bx--visually-hidden="{hideLabel}"
          class:bx--label--disabled="{disabled}"
        >
          <slot name="labelText">
            {labelText}
          </slot>
        </label>
      {/if}
      <input
        bind:this="{ref}"
        bind:value
        type="text"
        data-invalid="{invalid || undefined}"
        pattern="{pattern}"
        placeholder="{placeholder}"
        maxlength="{maxlength}"
        id="{id}"
        name="{name}"
        disabled="{disabled}"
        {...$$restProps}
        class:bx--time-picker__input-field="{true}"
        class:bx--text-input="{true}"
        class:bx--text-input--light="{light}"
        class:bx--text-input--invalid="{invalid}"
        on:change
        on:input
        on:keydown
        on:keyup
        on:focus
        on:blur
        on:paste
      />
    </div>
    <slot />
  </div>
  {#if invalid}
    <div class:bx--form-requirement="{true}">{invalidText}</div>
  {/if}
</div>
