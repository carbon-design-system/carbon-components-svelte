<script>
  import Link from "./Link.svelte";

  $: ref = null;
  $: ref && console.log(ref);
</script>

<div>
  <Link {...$$props} bind:ref>Link</Link>
</div>
