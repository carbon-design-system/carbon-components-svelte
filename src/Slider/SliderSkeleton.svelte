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
  <div class:bx--slider-container="{true}" class:bx--skeleton="{true}">
    <span class:bx--slider__range-label="{true}"></span>
    <div class:bx--slider="{true}">
      <div class:bx--slider__track="{true}"></div>
      <div class:bx--slider__filled-track="{true}"></div>
      <div class:bx--slider__thumb="{true}"></div>
    </div>
    <span class:bx--slider__range-label="{true}"></span>
  </div>
</div>
