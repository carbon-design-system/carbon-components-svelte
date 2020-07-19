<script>
  export let selected = undefined;
  export let border = false;
  export let selection = false;

  import { createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";

  const dispatch = createEventDispatcher();
  const selectedValue = writable(selected);

  setContext("StructuredListWrapper", {
    selectedValue,
    update: value => {
      selectedValue.set(value);
    }
  });

  $: selected = $selectedValue;
  $: dispatch("change", $selectedValue);
</script>

<section
  aria-label="Structured list section"
  class:bx--structured-list={true}
  class:bx--structured-list--border={border}
  class:bx--structured-list--selection={selection}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <slot />
</section>
