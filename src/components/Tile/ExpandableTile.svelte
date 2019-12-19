<script>
  let className = undefined;
  export { className as class };
  export let expanded = false;
  export let id = Math.random();
  export let tileCollapsedIconText = 'Interact to expand Tile';
  export let tileExpandedIconText = 'Interact to collapse Tile';
  export let tileMaxHeight = 0;
  export let tilePadding = 0;
  export let tabIndex = 0;
  export let light = false;
  export let props = {};

  import { createEventDispatcher, tick, onMount } from 'svelte';
  import ChevronDown16 from 'carbon-icons-svelte/lib/ChevronDown16';
  import { cx } from '../../lib';

  let tile = undefined;
  let tileContent = undefined;
  let aboveTheFold = undefined;

  const dispatch = createEventDispatcher();

  onMount(() => {
    const tileStyle = window.getComputedStyle(tile, null);
    tileMaxHeight = aboveTheFold.getBoundingClientRect().height;
    tilePadding =
      parseInt(tileStyle.getPropertyValue('padding-top'), 10) +
      parseInt(tileStyle.getPropertyValue('padding-bottom'), 10);
  });

  function setMaxHeight() {
    tileMaxHeight = expanded
      ? tileContent.getBoundingClientRect().height
      : aboveTheFold.getBoundingClientRect().height;
  }

  async function handleClick(event) {
    expanded = !expanded;
    await tick();
    setMaxHeight();
    dispatch('click', event);
  }

  async function handleKeyPress(event) {
    if (event.key === ' ' || event.key === 'Enter') {
      expanded = !expanded;
      await tick();
      setMaxHeight();
    }

    dispatch('keypress', event);
  }

  $: _class = cx(
    '--tile',
    '--tile--expandable',
    expanded && '--tile--is-expanded',
    light && '--tile--light',
    className
  );
  $: tileStyle = expanded ? undefined : `max-height: ${tileMaxHeight + tilePadding}px`;
</script>

<div
  {...props}
  bind:this={tile}
  style={tileStyle}
  class={_class}
  on:click={handleClick}
  on:keypress={handleKeyPress}
  tabindex={tabIndex}
  {id}>
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
