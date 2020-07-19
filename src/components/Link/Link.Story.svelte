<script>
  import Layout from "../../internal/ui/Layout.svelte";
  import Link from "./Link.svelte";

  $: ref = null;
  $: ref && console.log(ref);
</script>

<Layout>
  <div>
    <Link {...$$props} bind:ref>Link</Link>
  </div>
</Layout>
