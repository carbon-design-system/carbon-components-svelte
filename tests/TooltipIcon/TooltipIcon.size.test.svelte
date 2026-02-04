<script lang="ts">
  import { TooltipIcon } from "carbon-components-svelte";
  import MockIcon from "./MockIcon.svelte";

  export let size = 16;
</script>

<TooltipIcon tooltipText="Test" icon={MockIcon} {size} />
