<script>
  /** Set to `true` to use the range variant */
  export let range = false;

  /** Set an id to be used by the label element */
  export let id = "ccs-" + Math.random().toString(36);
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:cds--form-item="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div
    class:cds--date-picker="{true}"
    class:cds--skeleton="{true}"
    class:cds--date-picker--range="{true}"
    class:cds--date-picker--short="{!range}"
    class:cds--date-picker--simple="{!range}"
  >
    {#each Array.from({ length: range ? 2 : 1 }, (_, i) => i) as input, i (input)}
      <div class:cds--date-picker-container="{true}">
        <label for="{id}" class:cds--label="{true}"></label>
        <div
          class:cds--date-picker__input="{true}"
          class:cds--skeleton="{true}"
        ></div>
      </div>
    {/each}
  </div>
</div>
