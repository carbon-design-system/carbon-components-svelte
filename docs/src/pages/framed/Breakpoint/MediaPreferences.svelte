<script>
  import {
    orientation,
    prefersColorScheme,
    prefersReducedMotion,
    Tag,
  } from "carbon-components-svelte";

  const reducedMotion = prefersReducedMotion();
  const colorScheme = prefersColorScheme();
  const deviceOrientation = orientation();
</script>

<Tag>Reduced motion: {$reducedMotion}</Tag>
<Tag>Color scheme: {$colorScheme}</Tag>
<Tag>Orientation: {$deviceOrientation}</Tag>
<p>
  Toggle the corresponding setting in your OS, or rotate your device, to see
  these values change.
</p>
