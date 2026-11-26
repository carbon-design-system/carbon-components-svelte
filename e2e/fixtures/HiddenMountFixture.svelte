<script>
  import HiddenMountCases from "./HiddenMountCases.svelte";
</script>

<!-- The same cases mounted visible, for reference, then hidden three ways.
  The test reveals each and compares it with the visible set. -->
<div data-mode="visible"><HiddenMountCases /></div>
<div data-mode="hidden" hidden><HiddenMountCases /></div>
<div data-mode="display-none" style="display: none"><HiddenMountCases /></div>
<!-- Pushes the last set below the viewport, so it's skipped until scrolled
  to. -->
<div style="block-size: 300vh"></div>
<div
  data-mode="content-visibility"
  style="content-visibility: auto; contain-intrinsic-size: auto 1200px"
>
  <HiddenMountCases />
</div>
