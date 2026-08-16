<script>
  import Link from "carbon-components-svelte/Link/Link.svelte";
  import Tooltip from "carbon-components-svelte/Tooltip/Tooltip.svelte";
</script>

<!--
  A narrow containing block reproduces a real bug: the tooltip's
  `width: auto` shrink-to-fit sizing is bounded by its containing block
  (this wrapper), which is much narrower than the tooltip's natural content
  width. `position()` measures that too-narrow width before centering,
  so the caret ends up off-center from the trigger icon.
-->
<div style="width: 230px;" data-testid="narrow-container">
  <Tooltip triggerText="Round robin">
    <p>
      Distributes requests evenly across servers.
      <Link href="https://en.wikipedia.org/wiki/Round-robin_DNS" target="_blank"
        >Read more on Wikipedia</Link
      >
    </p>
  </Tooltip>
</div>
