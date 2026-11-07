<script lang="ts">
  import Masonry from "carbon-components-svelte/Masonry/Masonry.svelte";

  export let hideUntilPlaced = false;
</script>

<Masonry {hideUntilPlaced}>
  <div>Item 0</div>
  <div>Item 1</div>
  <div>Item 2</div>
</Masonry>
