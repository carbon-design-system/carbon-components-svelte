<script>
  import CopyButton from "./CopyButton.svelte";
</script>

<CopyButton
  {...$$props}
  on:click={() => {
    console.log('click');
  }}
  on:animationend={(e) => {
    console.log('animation end', e.animationName);
  }} />
