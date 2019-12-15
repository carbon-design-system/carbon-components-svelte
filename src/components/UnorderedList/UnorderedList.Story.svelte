<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import ListItem from '../ListItem';
  import UnorderedList from './UnorderedList.svelte';
</script>

<Layout>
  <div>
    {#if story === 'nested'}
      <UnorderedList>
        <ListItem>
          Unordered List level 1
          <UnorderedList nested>
            <ListItem>Unordered List level 2</ListItem>
            <ListItem>
              Unordered List level 2
              <UnorderedList nested>
                <ListItem>Unordered List level 2</ListItem>
                <ListItem>Unordered List level 2</ListItem>
              </UnorderedList>
            </ListItem>
          </UnorderedList>
        </ListItem>
        <ListItem>Unordered List level 1</ListItem>
        <ListItem>Unordered List level 1</ListItem>
      </UnorderedList>
    {:else}
      <UnorderedList>
        <ListItem>Unordered List level 1</ListItem>
        <ListItem>Unordered List level 1</ListItem>
        <ListItem>Unordered List level 1</ListItem>
      </UnorderedList>
    {/if}
  </div>
</Layout>
