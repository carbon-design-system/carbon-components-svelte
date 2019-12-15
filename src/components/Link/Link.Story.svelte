<script>
  export let href = undefined;
  export let inline = undefined;
  export let disabled = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import Link from './Link.svelte';
</script>

<Layout>
  <div>
    <Link {href} {inline} {disabled}>Link</Link>
  </div>
</Layout>
