<script>
  export let toggled = false;
  export let disabled = false;
  export let labelA = "Off";
  export let labelB = "On";
  export let labelText = "";
  export let id = "ccs-" + Math.random().toString(36);
  export let name = undefined;
</script>

<div
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <input
    type="checkbox"
    checked={toggled}
    {disabled}
    {id}
    {name}
    class:bx--toggle-input={true}
    class:bx--toggle-input--small={true}
    on:change
    on:change={() => {
      toggled = !toggled;
    }}
    on:keyup
    on:keyup={e => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggled = !toggled;
      }
    }}
    on:focus
    on:blur />
  <label
    aria-label={labelText ? undefined : $$props['aria-label'] || 'Toggle'}
    for={id}
    class:bx--toggle-input__label={true}>
    {labelText}
    <span class:bx--toggle__switch={true}>
      <svg
        width="6"
        height="5"
        viewBox="0 0 6 5"
        class:bx--toggle__check={true}>
        <path d="M2.2 2.7L5 0 6 1 2.2 5 0 2.7 1 1.5z" />
      </svg>
      <span aria-hidden="true" class:bx--toggle__text--off={true}>
        {labelA}
      </span>
      <span aria-hidden="true" class:bx--toggle__text--on={true}>{labelB}</span>
    </span>
  </label>
</div>
