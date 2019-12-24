<script>
  let className = undefined;
  export { className as class };
  export let paragraph = false;
  export let lineCount = 3;
  export let width = '100%';
  export let heading = false;
  export let style = undefined;

  import { cx } from '../../lib';

  const randoms = [0.973051493507435, 0.15334737213558558, 0.5671034553053769];
  let lines = [];

  $: widthNum = parseInt(width, 10);
  $: widthPx = width.includes('px');
  $: widthPercent = width.includes('%');
  $: if (paragraph) {
    for (let i = 0; i < lineCount; i++) {
      const min = widthPx ? widthNum - 75 : 0;
      const max = widthPx ? widthNum : 75;
      const randomWidth = Math.floor(randoms[i % 3] * (max - min + 1)) + min + 'px';
      lines = [...lines, { width: widthPx ? randomWidth : `calc(${width} - ${randomWidth})` }];
    }
  }
</script>

{#if paragraph}
  <div on:click on:mouseover on:mouseenter on:mouseleave {style}>
    {#each lines as { width }}
      <p
        class={cx('--skeleton__text', heading && '--skeleton__heading', className)}
        style={`width: ${width};`} />
    {/each}
  </div>
{:else}
  <p
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    class={cx('--skeleton__text', heading && '--skeleton__heading', className)}
    style={`width: ${width};`}
    {style} />
{/if}
