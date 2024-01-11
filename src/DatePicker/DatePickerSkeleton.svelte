<script>
  /** Set to `true` to use the range variant */
  export let range = false;

  /** Set an id to be used by the label element */
  export let id = "ccs-" + Math.random().toString(36);
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div
    class:bx--date-picker="{true}"
    class:bx--skeleton="{true}"
    class:bx--date-picker--range="{true}"
    class:bx--date-picker--short="{!range}"
    class:bx--date-picker--simple="{!range}"
  >
    {#each Array.from({ length: range ? 2 : 1 }, (_, i) => i) as input, i (input)}
      <div class:bx--date-picker-container="{true}">
        <label for="{id}" class:bx--label="{true}"></label>
        <div
          class:bx--date-picker__input="{true}"
          class:bx--skeleton="{true}"
        ></div>
      </div>
    {/each}
  </div>
</div>
