<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import ListItem from '../ListItem';
  import OrderedList from './OrderedList.svelte';
</script>

<Layout>
  <div>
    {#if story === 'nested'}
      <OrderedList>
        <ListItem>
          Unordered List level 1
          <OrderedList nested>
            <ListItem>Ordered List level 2</ListItem>
            <ListItem>
              Ordered List level 2
              <OrderedList nested>
                <ListItem>Ordered List level 2</ListItem>
                <ListItem>Ordered List level 2</ListItem>
              </OrderedList>
            </ListItem>
          </OrderedList>
        </ListItem>
        <ListItem>Ordered List level 1</ListItem>
        <ListItem>Ordered List level 1</ListItem>
      </OrderedList>
    {:else}
      <OrderedList>
        <ListItem>Ordered List level 1</ListItem>
        <ListItem>Ordered List level 1</ListItem>
        <ListItem>Ordered List level 1</ListItem>
      </OrderedList>
    {/if}
  </div>
</Layout>
