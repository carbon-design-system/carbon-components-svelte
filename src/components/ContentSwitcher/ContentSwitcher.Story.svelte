<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import ContentSwitcher from './ContentSwitcher.svelte';
  import Switch from './Switch.svelte';
</script>

<Layout>
  {#if story === 'selected'}
    <ContentSwitcher>
      <Switch {...$$props} text="First section" />
      <Switch {...$$props} text="Second section" selected />
      <Switch {...$$props} text="Third section" />
    </ContentSwitcher>
  {:else}
    <ContentSwitcher>
      <Switch {...$$props} text="First section" />
      <Switch {...$$props} text="Second section" />
      <Switch {...$$props} text="Third section" />
    </ContentSwitcher>
  {/if}
</Layout>
