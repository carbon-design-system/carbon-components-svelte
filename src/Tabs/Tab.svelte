<script>
  export let disabled = false;
  export let href = "#";
  export let label = "";
  export let role = "presentation";
  export let tabindex = "0";
  export let id = "ccs-" + Math.random().toString(36);
  export let ref = null;

  import { getContext } from "svelte";

  const { selectedTab, add, update, change } = getContext("Tabs");

  add({ id, label, disabled });

  $: selected = $selectedTab === id;
  $: if (selected && ref) {
    ref.focus();
  }
</script>

<li
  tabindex="-1"
  {role}
  class:bx--tabs__nav-item={true}
  class:bx--tabs__nav-item--disabled={disabled}
  class:bx--tabs__nav-item--selected={selected}
  {...$$restProps}
  on:click|preventDefault={() => {
    if (!disabled) {
      update(id);
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown={({ key }) => {
    if (!disabled) {
      if (key === 'ArrowRight') {
        change(1);
      } else if (key === 'ArrowLeft') {
        change(-1);
      } else if (key === ' ' || key === 'Enter') {
        update(id);
      }
    }
  }}>
  <a
    bind:this={ref}
    role="tab"
    tabindex={disabled ? '-1' : tabindex}
    aria-selected={selected}
    aria-disabled={disabled}
    {href}
    class:bx--tabs__nav-link={true}>
    {label}
  </a>
</li>
