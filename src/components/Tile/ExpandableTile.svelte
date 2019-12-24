<script>
  let className = undefined;
  export { className as class };
  export let expanded = false;
  export let id = Math.random();
  export let tileCollapsedIconText = 'Interact to expand Tile';
  export let tileExpandedIconText = 'Interact to collapse Tile';
  export let tileMaxHeight = 0;
  export let tilePadding = 0;
  export let tabindex = '0';
  export let light = false;
  export let style = undefined;

  import { tick } from 'svelte';
  import ChevronDown16 from 'carbon-icons-svelte/lib/ChevronDown16';
  import { cx, css } from '../../lib';

  let tile = undefined;
  let tileContent = undefined;
  let aboveTheFold = undefined;

  async function setHeight() {
    await tick();
    tileMaxHeight = expanded
      ? tileContent.getBoundingClientRect().height
      : aboveTheFold.getBoundingClientRect().height;
  }

  $: {
    if (tile) {
      const style = window.getComputedStyle(tile);

      tileMaxHeight = aboveTheFold.getBoundingClientRect().height;
      tilePadding =
        parseInt(style.getPropertyValue('padding-top'), 10) +
        parseInt(style.getPropertyValue('padding-bottom'), 10);
    }
  }
</script>

<div
  bind:this={tile}
  style={expanded ? undefined : `max-height: ${tileMaxHeight + tilePadding}px`}
  class={cx('--tile', '--tile--expandable', expanded && '--tile--is-expanded', light && '--tile--light', className)}
  on:click
  on:click={() => {
    expanded = !expanded;
    setHeight();
  }}
  on:keypress
  on:keypress={event => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      expanded = !expanded;
      setHeight();
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  {tabindex}
  {id}
  {style}>
  <div bind:this={tileContent}>
    <div bind:this={aboveTheFold} class={cx('--tile-content')}>
      <slot name="above" />
    </div>
    <button
      aria-expanded={expanded}
      aria-label={expanded ? tileExpandedIconText : tileCollapsedIconText}
      class={cx('--tile__chevron')}>
      <ChevronDown16 />
    </button>
    <div class={cx('--tile-content')}>
      <slot name="below" />
    </div>
  </div>
</div>
