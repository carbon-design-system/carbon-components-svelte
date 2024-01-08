<script>
  /** Set to `true` to use the vertical variant */
  export let vertical = false;

  /** Specify the number of steps to render */
  export let count = 4;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<ul
  class:cds--progress="{true}"
  class:cds--progress--vertical="{vertical}"
  class:cds--skeleton="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#each Array.from({ length: count }, (_, i) => i) as item, i (item)}
    <li
      class:cds--progress-step="{true}"
      class:cds--progress-step--incomplete="{true}"
    >
      <div
        class:cds--progress-step-button="{true}"
        class:cds--progress-step-button--unclickable="{true}"
      >
        <svg>
          <path d="M 7, 7 m -7, 0 a 7,7 0 1,0 14,0 a 7,7 0 1,0 -14,0"></path>
        </svg>
        <p class:cds--progress-label="{true}"></p>
        <span class:cds--progress-line="{true}"></span>
      </div>
    </li>
  {/each}
</ul>
