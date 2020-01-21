<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import Button from '../Button';
  import Dropdown from './Dropdown.svelte';
  import DropdownSkeleton from './Dropdown.Skeleton.svelte';

  let items = [
    { id: 'option-0', text: 'Option 1' },
    { id: 'option-1', text: 'Option 2' },
    { id: 'option-2', text: 'Option 3' },
    { id: 'option-3', text: 'Option 4' }
  ];

  let selectedIndex = -1;
</script>

<Layout>

  {#if story === 'skeleton'}
    <div style="width: 300px">
      <DropdownSkeleton />
      &nbsp;
      <DropdownSkeleton inline />
    </div>
  {:else}
    <p>Currently, this component does not support items as slots.</p>
    <p>
      <code>items</code>
      must be an array of objects; mandatory fields are `id` and `text`.
    </p>
    <pre style="margin-top: 1rem;">
      <code>{'items = Array<{ id: string; text: string; }>'}</code>
    </pre>
    <div style="margin-top: 2rem; margin-bottom: 2rem;">
      <Button
        size="small"
        on:click={() => {
          selectedIndex = selectedIndex > -1 ? -1 : 1;
        }}>
        {selectedIndex > -1 ? 'Clear selected item' : "Set item to 'Option 2'"}
      </Button>
    </div>
    <div style="width: 300px">
      <Dropdown {...$$props} bind:selectedIndex {items} />
    </div>
  {/if}
</Layout>
