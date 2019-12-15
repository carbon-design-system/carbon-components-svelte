<script>
  import Layout from '../../internal/ui/Layout.svelte';
  import SkeletonText from './SkeletonText.svelte';
</script>

<Layout>
  <div style="width: 300px">
    <SkeletonText {...$$props} />
  </div>
</Layout>
