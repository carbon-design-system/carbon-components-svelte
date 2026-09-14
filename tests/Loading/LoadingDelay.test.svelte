<script lang="ts">
  import Loading from "carbon-components-svelte/Loading/Loading.svelte";

  export let active = true;
  export let delay = 0;
</script>

<div data-testid="delayed">
  <Loading withOverlay={false} {active} {delay} />
</div>
