<script lang="ts">
  import Loading from "carbon-components-svelte/Loading/Loading.svelte";

  export let active = true;
  export let delay = 0;
  export let withOverlay = false;
  export let description = "loading";
</script>

<div data-testid="delayed">
  <Loading {withOverlay} {active} {delay} {description} />
</div>
