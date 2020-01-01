<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import ClickableTile from './ClickableTile.svelte';
  import ExpandableTile from './ExpandableTile.svelte';
  import RadioTile from './RadioTile.svelte';
  import SelectableTile from './SelectableTile.svelte';
  import Tile from './Tile.svelte';
  import TileGroup from './TileGroup.svelte';

  const radioTiles = [
    { value: 'standard', id: 'tile-1', labelText: 'Selectable Tile' },
    { value: 'default-selected', id: 'tile-2', labelText: 'Selectable Tile' },
    { value: 'selected', id: 'tile-3', labelText: 'Selectable Tile' }
  ];

  let selected = radioTiles[1].value;

  let selectedTile1 = false;
</script>

<Layout>
  <div>
    {#if story === 'filter'}
      <Tile {...$$props} />
    {:else if story === 'clickable'}
      <ClickableTile {...$$props}>Clickable Tile</ClickableTile>
    {:else if story === 'multi-select'}
      <div role="group" aria-label="selectable tiles">
        <SelectableTile
          {...$$props}
          id="tile-1"
          name="tiles"
          bind:selected={selectedTile1}
          on:select={({ detail }) => {
            console.log('on:select', detail);
          }}
          on:deselect={({ detail }) => {
            console.log('on:deselect', detail);
          }}>
          Multi-select Tile
        </SelectableTile>
        <SelectableTile {...$$props} id="tile-2" name="tiles">Multi-select Tile</SelectableTile>
        <SelectableTile {...$$props} id="tile-3" name="tiles">Multi-select Tile</SelectableTile>
      </div>
    {:else if story === 'selectable'}
      <TileGroup legend="Selectable Tile Group" bind:selected>
        {#each radioTiles as { value, id, labelText }, i (id)}
          <RadioTile {...$$props} {value} {id} {labelText}>Selectable Tile</RadioTile>
        {/each}
      </TileGroup>
    {:else if story === 'expandable'}
      <ExpandableTile {...$$props}>
        <div slot="above" style="height: 200px">Above the fold content here</div>
        <div slot="below" style="height: 400px">Below the fold content here</div>
      </ExpandableTile>
    {:else}
      <Tile {...$$props}>Default Tile</Tile>
    {/if}
  </div>
</Layout>
