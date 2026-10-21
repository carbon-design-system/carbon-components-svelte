<script lang="ts">
  import Loading from "carbon-components-svelte/Loading/Loading.svelte";
</script>

<div data-testid="default-loader"><Loading /></div>

<div data-testid="loader-no-overlay"><Loading withOverlay={false} /></div>

<div data-testid="loader-small"><Loading withOverlay={false} small /></div>

<div data-testid="loader-inactive"><Loading active={false} /></div>

<div data-testid="loader-description">
  <Loading description="Processing data..." />
</div>

<div data-testid="loader-rest">
  <Loading id="rest-overlay" data-extra="yes" />
</div>

<div data-testid="loader-no-overlay-inactive">
  <Loading withOverlay={false} active={false} />
</div>
