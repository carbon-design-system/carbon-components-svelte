<script>
  import { breakpointObserver, breakpoints } from "carbon-components-svelte";

  const size = breakpointObserver();
  const smaller = size.smallerThan("md");
  const larger = size.largerThan("md");
</script>

<p>Current breakpoint size: {$size}</p>
<p>Current breakpoint value: {breakpoints[$size]}px</p>
<p>Smaller than medium: {$smaller}</p>
<p>Larger than medium: {$larger}</p>
