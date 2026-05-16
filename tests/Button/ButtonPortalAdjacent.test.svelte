<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
</script>

<Button
  data-testid="btn-portal-a"
  icon={Add}
  portalTooltip
  tooltipPosition="top"
  iconDescription="Tooltip A"
/>
<Button
  data-testid="btn-portal-b"
  icon={Add}
  portalTooltip
  tooltipPosition="top"
  iconDescription="Tooltip B"
/>
