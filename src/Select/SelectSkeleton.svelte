<script>
  /** Set to `true` to hide the label text */
  export let hideLabel = false;
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
  {#if !hideLabel}
    <span class:bx--label="{true}" class:bx--skeleton="{true}"></span>
  {/if}
  <div class:bx--select="{true}" class:bx--skeleton="{true}">
    <div class:bx--select-input="{true}"></div>
  </div>
</div>
