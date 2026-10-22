<svelte:options accessors />

<script lang="ts">
  import OutboundLink from "carbon-components-svelte/Link/OutboundLink.svelte";

  export let onFocus: () => void = () => {};
  export let onBlur: () => void = () => {};
  export let onKeydown: () => void = () => {};
  export let onKeyup: () => void = () => {};
</script>

<!-- Default outbound link -->
<div data-testid="default">
  <OutboundLink
    href="https://www.carbondesignsystem.com/"
    on:focus={() => onFocus()}
    on:blur={() => onBlur()}
    on:keydown={() => onKeydown()}
    on:keyup={() => onKeyup()}
  >
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

<!-- Consumer rel -->
<div data-testid="rel-override">
  <OutboundLink href="https://www.carbondesignsystem.com/" rel="nofollow">
    Carbon Design System
  </OutboundLink>
</div>
