<script>
  import Layout from '../../internal/ui/Layout.svelte';
  import CopyButton from './CopyButton.svelte';
</script>

<Layout>
  <div style="position: relative;">
    <CopyButton {...$$props} />
  </div>
</Layout>
