<script>
  import Layout from "../../internal/ui/Layout.svelte";
  import CopyButton from "./CopyButton.svelte";
</script>

<Layout>
  <CopyButton
    {...$$props}
    on:click={() => {
      console.log('click');
    }}
    on:animationend={e => {
      console.log('animation end', e.animationName);
    }} />
</Layout>
