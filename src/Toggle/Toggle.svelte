<script>
  /**
   * Set to `true` to toggle the checkbox input
   * @type {boolean} [toggled=false]
   */
  export let toggled = false;

  /**
   * Set to `true` to disable checkbox input
   * @type {boolean} [disabled=false]
   */
  export let disabled = false;

  /**
   * Specify the label for the untoggled state
   * @type {string} [labelA="Off"]
   */
  export let labelA = "Off";

  /**
   * Specify the label for the toggled state
   * @type {string} [labelB="On"]
   */
  export let labelB = "On";

  /**
   * Specify the label text
   * @type {string} [labelText=""]
   */
  export let labelText = "";

  /**
   * Set an id for the input element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the checkbox input
   * @type {string} [name]
   */
  export let name = undefined;
</script>

<div
  class:bx--form-item="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <input
    type="checkbox"
    class:bx--toggle-input="{true}"
    checked="{toggled}"
    on:change
    on:change="{() => {
      toggled = !toggled;
    }}"
    on:keyup
    on:keyup="{(e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggled = !toggled;
      }
    }}"
    on:focus
    on:blur
    disabled="{disabled}"
    id="{id}"
    name="{name}"
  />
  <label
    aria-label="{labelText ? undefined : $$props['aria-label'] || 'Toggle'}"
    for="{id}"
    class:bx--toggle-input__label="{true}"
  >
    {labelText}
    <span class:bx--toggle__switch="{true}">
      <span aria-hidden="true" class:bx--toggle__text--off="{true}">
        {labelA}
      </span>
      <span
        aria-hidden="true"
        class:bx--toggle__text--on="{true}"
      >{labelB}</span>
    </span>
  </label>
</div>
