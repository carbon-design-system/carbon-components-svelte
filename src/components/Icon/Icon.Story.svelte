<script>
  export let story = undefined;

  import ChevronDown16 from 'carbon-icons-svelte/lib/ChevronDown16';
  import ArrowLeft20 from 'carbon-icons-svelte/lib/ArrowLeft20';
  import Add24 from 'carbon-icons-svelte/lib/Add24';
  import Layout from '../../internal/ui/Layout.svelte';
  import Icon from './Icon.svelte';
  import IconSkeleton from './Icon.Skeleton.svelte';

  const icons = { ChevronDown16, ArrowLeft20, Add24 };
</script>

<Layout>
  {#if story === 'skeleton'}
    <div>
      <IconSkeleton size={16} style="margin: 2rem;" />
      <IconSkeleton size={32} style="margin: 2rem" />
    </div>
  {:else}
    <Icon {...$$props} render={icons[$$props.icon]} />
  {/if}
</Layout>
