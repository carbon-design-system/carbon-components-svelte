<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import Tab from './Tab.svelte';
  import TabContent from './TabContent.svelte';
  import Tabs from './Tabs.svelte';
  import TabsSkeleton from './TabsSkeleton.svelte';

  const { tabProps, ...tabsProps } = $$props;

  let selected = 0;
</script>

<Layout>
  {#if story === 'skeleton'}
    <TabsSkeleton />
  {:else if story === 'container'}
    <Tabs {...tabsProps} type="container" bind:selected>
      <Tab {...tabProps} label="Tab label 1" />
      <Tab {...tabProps} label="Tab label 2" />
      <Tab {...tabProps} label="Tab label 3" />
      <div slot="content">
        <TabContent>Content 1</TabContent>
        <TabContent>Content 2</TabContent>
        <TabContent>Content 3</TabContent>
      </div>
    </Tabs>
  {:else}
    <Tabs {...tabsProps} bind:selected>
      <Tab {...tabProps} label="Tab label 1" />
      <Tab {...tabProps} label="Tab label 2" />
      <Tab {...tabProps} label="Tab label 3" disabled />
      <Tab {...tabProps} label="Tab label 4" />
      <div slot="content">
        <TabContent>Content 1</TabContent>
        <TabContent>Content 2</TabContent>
        <TabContent>Content 3</TabContent>
        <TabContent>Content 4</TabContent>
      </div>
    </Tabs>
  {/if}
</Layout>
