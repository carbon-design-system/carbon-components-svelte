<script>
  import { EmptyState } from "carbon-components-svelte";
  import Folder from "carbon-icons-svelte/lib/Folder.svelte";
</script>

<EmptyState data-testid="lg-icon" title="Icon">
  <Folder slot="illustration" />
</EmptyState>
<EmptyState data-testid="lg-icon-24" title="Icon at 24">
  <Folder slot="illustration" size={24} />
</EmptyState>
<!-- A pictogram's markup: a 32-unit drawing sized 64px, as carbon-pictograms-svelte renders it. -->
<EmptyState data-testid="lg-pictogram" title="Pictogram">
  <svg slot="illustration" viewBox="0 0 32 32" width="64" height="64">
    <rect x="2" y="4" width="28" height="24" />
  </svg>
</EmptyState>
<EmptyState data-testid="lg-large" title="Large art">
  <svg slot="illustration" viewBox="0 0 120 120" width="120" height="120">
    <rect width="120" height="120" />
  </svg>
</EmptyState>
<EmptyState data-testid="lg-unsized" title="Unsized art">
  <svg slot="illustration" viewBox="0 0 32 32">
    <rect width="32" height="32" />
  </svg>
</EmptyState>
<EmptyState data-testid="sm-icon" size="sm" title="Icon">
  <Folder slot="illustration" />
</EmptyState>
<EmptyState data-testid="sm-pictogram" size="sm" title="Pictogram">
  <svg slot="illustration" viewBox="0 0 32 32" width="64" height="64">
    <rect x="2" y="4" width="28" height="24" />
  </svg>
</EmptyState>
<EmptyState data-testid="sm-unsized" size="sm" title="Unsized art">
  <svg slot="illustration" viewBox="0 0 32 32">
    <rect width="32" height="32" />
  </svg>
</EmptyState>
