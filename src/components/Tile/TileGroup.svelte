<script>
  let className = undefined;
  export { className as class };
  export let defaultSelected = { value: undefined };
  export let disabled = false;
  export let legend = '';
  export let style = undefined;

  import { createEventDispatcher, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();
  let tiles = [];
  let selected = writable(defaultSelected);

  setContext('TileGroup', {
    selected,
    addTile: tile => {
      tiles = [...tiles, tile];
    },
    updateSelected: tile => {
      selected.set(tile);
    }
  });

  $: {
    const checkedTiles = tiles.filter(tile => tile.checked);

    if (checkedTiles.length > 1) {
      console.warn('Multiple RadioTiles cannot be checked.');

      if (defaultSelected.value) {
        console.warn('Using `defaultSelected`:', defaultSelected);
      } else {
        console.warn('Using `RadioTile`:', checkedTiles[0]);
        selected.set(checkedTiles[0]);
      }
    } else if (checkedTiles.length === 1) {
      selected.set(checkedTiles[0]);
      tiles = [];
    }

    defaultSelected = $selected;
    dispatch('select', $selected);
  }
</script>

<fieldset class={cx('--tile-group', className)} {disabled} {style}>
  {#if legend}
    <legend>{legend}</legend>
  {/if}
  <div>
    <slot />
  </div>
</fieldset>
