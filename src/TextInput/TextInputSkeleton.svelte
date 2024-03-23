<script>
  /** Set to `true` to hide the label text */
  export let hideLabel = false;

  /**
   * Specify the div HTML attributes for the skeleton container
   * @type {import('svelte/elements').HTMLDivAttributes}
   */
  export let divAttributes = {};
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item="{true}"
  {...divAttributes}
  on:click
  on:pointerup
  on:pointerover
  on:pointerenter
  on:pointerleave
>
  {#if !hideLabel}
    <span class:bx--label="{true}" class:bx--skeleton="{true}"></span>
  {/if}
  <div class:bx--skeleton="{true}" class:bx--text-input="{true}"></div>
</div>
