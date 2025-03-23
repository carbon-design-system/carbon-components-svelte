<script lang="ts">
import { Loading } from "carbon-components-svelte";
</script>

<!-- Default loading (with overlay) -->
<div data-testid="default-loader">
  <Loading />
</div>

<!-- Loading without overlay -->
<div data-testid="loader-no-overlay">
  <Loading withOverlay={false} />
</div>

<!-- Small loading -->
<div data-testid="loader-small">
  <Loading withOverlay={false} small />
</div>

<!-- Inactive loading -->
<div data-testid="loader-inactive">
  <Loading active={false} />
</div>

<!-- Custom description -->
<div data-testid="loader-description">
  <Loading description="Processing data..." />
</div>
