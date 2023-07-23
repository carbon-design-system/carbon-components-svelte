<script>
  /** Specify the number of lines to render */
  export let lines = 3;

  /** Set to `true` to use the heading size variant */
  export let heading = false;

  /** Set to `true` to use the paragraph size variant */
  export let paragraph = false;

  /** Specify the width of the text (% or px) */
  export let width = "100%";

  const RANDOM = [0.973, 0.153, 0.567];

  $: rows = [];
  $: widthNum = parseInt(width, 10);
  $: widthPx = width.includes("px");
  $: if (paragraph) {
    for (let i = 0; i < lines; i++) {
      const min = widthPx ? widthNum - 75 : 0;
      const max = widthPx ? widthNum : 75;
      const rand = Math.floor(RANDOM[i % 3] * (max - min + 1)) + min + "px";
      rows = [...rows, { width: widthPx ? rand : `calc(${width} - ${rand})` }];
    }
  }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
{#if paragraph}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div {...$$restProps} on:click on:mouseover on:mouseenter on:mouseleave>
    {#each rows as { width }}
      <p
        class:bx--skeleton__text="{true}"
        class:bx--skeleton__heading="{heading}"
        style:width="{width}"
      ></p>
    {/each}
  </div>
{:else}
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <p
    class:bx--skeleton__text="{true}"
    class:bx--skeleton__heading="{heading}"
    style:width="{width}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  ></p>
{/if}
