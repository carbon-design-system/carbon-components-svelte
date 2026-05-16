<script lang="ts">
  import HeaderGlobalAction from "carbon-components-svelte/UIShell/HeaderGlobalAction.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
</script>

<HeaderGlobalAction
  data-testid="header-global-action"
  icon={Add}
  iconDescription="Tooltip text"
  portalTooltip
/>
