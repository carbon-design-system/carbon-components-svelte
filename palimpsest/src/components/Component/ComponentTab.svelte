<script>
  export let params = {};

  import { getContext } from 'svelte';
  import { components } from './Component.svelte';

  const { set } = getContext('Component');

  const paramMap = {
    Preview: 'Preview',
    API: 'API',
    'kitchen-sink': 'KitchenSink'
  };

  $: tabName = params.tab || 'Preview';
  $: tab = paramMap[tabName];
  $: {
    set(params.name);
    document.title = `${params.name} · ${tabName}`;
  }
</script>

<svelte:component this={components[params.name][tab]} />
