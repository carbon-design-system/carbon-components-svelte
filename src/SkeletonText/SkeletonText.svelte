<script>
  /** Specify the number of lines to render */
  export let lines = 3;

  /** Set to `true` to use the heading size variant */
  export let heading = false;

  /** Set to `true` to use the paragraph size variant */
  export let paragraph = false;

  /** Specify the width of the text (% or px) */
  export let width = "100%";

  /**
   * Set to `true` to remove the bottom margin, such as for a placeholder
   * in a flex or grid row that sets its own spacing.
   */
  export let noMargin = false;

  const RANDOM = [0.973, 0.153, 0.567];

  $: widthNum = Number.parseInt(width, 10);
  $: widthPx = width.includes("px");
</script>

{#if paragraph}
  <div
    aria-hidden="true"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    {#each Array.from({ length: lines }).map((_, i) => {
      const min = widthPx ? widthNum - 75 : 0;
      const max = widthPx ? widthNum : 75;
      const rand = `${Math.floor(RANDOM[i % 3] * (max - min + 1)) + min}px`;

      return widthPx ? rand : `calc(${width} - ${rand})`;
    }) as width, i (i)}
      <p
        class:bx--skeleton__text={true}
        class:bx--skeleton__heading={heading}
        class:bx--skeleton__text--no-margin={noMargin}
        style:width
      ></p>
    {/each}
  </div>
{:else}
  <p
    aria-hidden="true"
    class:bx--skeleton__text={true}
    class:bx--skeleton__heading={heading}
    class:bx--skeleton__text--no-margin={noMargin}
    style:width
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  ></p>
{/if}
