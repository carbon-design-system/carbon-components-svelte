<script>
  import SkeletonPlaceholder from "./SkeletonPlaceholder.svelte";
</script>

<style>
  :global(.my--skeleton__placeholder--small) {
    height: 100px;
    width: 100px;
  }

  :global(.my--skeleton__placeholder--medium) {
    height: 150px;
    width: 150px;
  }

  :global(.my--skeleton__placeholder--large) {
    height: 250px;
    width: 250px;
  }
</style>

<div style="height: 250px; width: 250px;">
  <SkeletonPlaceholder {...$$props} />
</div>
