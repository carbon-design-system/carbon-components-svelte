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

  $: tab = paramMap[params.tab || 'Preview'];
  $: {
    set(params.name);
  }
</script>

<svelte:component this={components[params.name][tab]} />
