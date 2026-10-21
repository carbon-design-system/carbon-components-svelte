<script lang="ts">
  import ClickableTile from "carbon-components-svelte/Tile/ClickableTile.svelte";
  import ArrowRight from "carbon-icons-svelte/lib/ArrowRight.svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
</script>

<ClickableTile href="/docs/deploy" icon={ArrowRight}>
  Deployment guide
</ClickableTile>

<ClickableTile
  href="https://status.example.com"
  target="_blank"
  icon={Launch}
  data-testid="external"
>
  Service status
</ClickableTile>

<ClickableTile icon={ArrowRight} disabled data-testid="disabled">
  Billing settings
</ClickableTile>

<ClickableTile href="/docs/regions" data-testid="no-icon">
  Supported regions
</ClickableTile>
