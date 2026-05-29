<svelte:options accessors />

<script lang="ts">
  import { OutboundLink } from "carbon-components-svelte";
</script>

<!-- Default outbound link -->
<div data-testid="default">
  <OutboundLink href="https://www.carbondesignsystem.com/">
    Carbon Design System
  </OutboundLink>
</div>

<!-- Custom assistive text -->
<div data-testid="custom">
  <OutboundLink
    href="https://www.carbondesignsystem.com/"
    assistiveText="(opens in a new window)"
  >
    Carbon Design System
  </OutboundLink>
</div>

<!-- Announcement opted out -->
<div data-testid="empty">
  <OutboundLink href="https://www.carbondesignsystem.com/" assistiveText="">
    Carbon Design System
  </OutboundLink>
</div>
