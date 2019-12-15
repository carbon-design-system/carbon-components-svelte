<script>
  import Filter16 from 'carbon-icons-svelte/lib/Filter16';
  import Layout from '../../internal/ui/Layout.svelte';
  import TooltipIcon from './TooltipIcon.svelte';
</script>

<Layout>
  <div>
    <TooltipIcon {...$$props}>
      <Filter16 />
    </TooltipIcon>
  </div>
</Layout>
