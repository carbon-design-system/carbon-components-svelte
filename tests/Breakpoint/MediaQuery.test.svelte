<script>
  import {
    mediaQuery,
    orientation,
    prefersColorScheme,
    prefersReducedMotion,
  } from "carbon-components-svelte/Breakpoint/media-query";

  const wide = mediaQuery("(min-width: 900px)");
  const reducedMotion = prefersReducedMotion();
  const colorScheme = prefersColorScheme();
  const deviceOrientation = orientation();
</script>

<div data-testid="wide">{$wide}</div>
<div data-testid="reduced-motion">{$reducedMotion}</div>
<div data-testid="color-scheme">{$colorScheme}</div>
<div data-testid="orientation">{$deviceOrientation}</div>
