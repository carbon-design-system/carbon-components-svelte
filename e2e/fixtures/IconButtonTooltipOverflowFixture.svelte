<script>
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
</script>

<!--
  A long iconDescription reproduces a real bug: the icon-only trigger's
  invisible tooltip bubble (`.bx--assistive-text`) was sized up to its full
  max-width even while hidden. `clip: rect()` hid it from view but not from
  layout, so a trigger near the page's edge inflated the document's
  scrollWidth with no visible cause. Padding pushes the trigger flush against
  the right edge of a narrow viewport without clipping it in an overflow
  container, matching how the bug actually surfaced (page-level overflow).
-->
<div style="padding-left: 320px;">
  <Button
    kind="ghost"
    size="small"
    icon={TrashCan}
    iconDescription="Delete API key — internal dashboard"
    data-testid="delete-trigger"
  />
</div>
