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
  <div class:cds--number="{true}" class:cds--skeleton="{true}"></div>
</div>
