<script lang="ts">
  import { getChartTheme } from "carbon-components-svelte/Theme/chart-theme.js";

  export let testid: string;

  const chartTheme = getChartTheme();
</script>

<span data-testid={testid}>{$chartTheme}</span>
