<script>
  /** Set to `true` to hide the label text */
  export let hideLabel = false;
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
  {#if !hideLabel}
    <span class:cds--label="{true}" class:cds--skeleton="{true}"></span>
  {/if}
  <div class:cds--slider-container="{true}" class:cds--skeleton="{true}">
    <span class:cds--slider__range-label="{true}"></span>
    <div class:cds--slider="{true}">
      <div class:cds--slider__track="{true}"></div>
      <div class:cds--slider__filled-track="{true}"></div>
      <div class:cds--slider__thumb="{true}"></div>
    </div>
    <span class:cds--slider__range-label="{true}"></span>
  </div>
</div>
