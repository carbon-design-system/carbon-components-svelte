<script>
  let className = undefined;
  export { className as class };
  export let expanded = false;
  export let id = Math.random();
  export let light = false;
  export let style = undefined;
  export let tabindex = '0';
  export let tileCollapsedIconText = 'Interact to expand Tile';
  export let tileExpandedIconText = 'Interact to collapse Tile';
  export let tileMaxHeight = 0;
  export let tilePadding = 0;

  import { afterUpdate } from 'svelte';
  import ChevronDown16 from 'carbon-icons-svelte/lib/ChevronDown16';
  import { cx, css } from '../../lib';

  let tileRef = undefined;
  let contentRef = undefined;
  let aboveRef = undefined;

  afterUpdate(() => {
    if (tileMaxHeight === 0) {
      tileMaxHeight = aboveRef.getBoundingClientRect().height;
    }

    const style = window.getComputedStyle(tileRef);
    
    tilePadding =
      parseInt(style.getPropertyValue('padding-top'), 10) +
      parseInt(style.getPropertyValue('padding-bottom'), 10);
  });
</script>

<div
  bind:this={tileRef}
  class={cx('--tile', '--tile--expandable', expanded && '--tile--is-expanded', light && '--tile--light', className)}
  style={expanded ? undefined : css([style, `max-height: ${tileMaxHeight + tilePadding}px`])}
  on:click
  on:click={() => {
    expanded = !expanded;
  }}
  on:keypress
  on:keypress={event => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      expanded = !expanded;
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  {tabindex}
  {id}>
  <div bind:this={contentRef}>
    <div bind:this={aboveRef} class={cx('--tile-content')}>
      <span
        on:click
        on:mouseover
        on:mouseenter
        on:mouseleave
        class={cx('--tile-content__above-the-fold')}>
        <slot name="above" />
      </span>
    </div>
    <button
      aria-expanded={expanded}
      aria-label={expanded ? tileExpandedIconText : tileCollapsedIconText}
      class={cx('--tile__chevron')}>
      <ChevronDown16 />
    </button>
    <div class={cx('--tile-content')}>
      <span
        on:click
        on:mouseover
        on:mouseenter
        on:mouseleave
        class={cx('--tile-content__below-the-fold')}>
        <slot name="below" />
      </span>
    </div>
  </div>
</div>
