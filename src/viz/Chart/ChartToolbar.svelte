<svelte:options immutable />

<script>
  /** @restProps {div} */

  /** Set to `false` to hide the button that switches to the data table */
  export let table = true;

  /** Set to `false` to hide the CSV download button */
  export let csv = true;

  /** Specify the downloaded file name, without the extension */
  export let filename = "chart";

  /** Specify the label of the button while the chart is showing */
  export let tableLabel = "Show as table";

  /** Specify the label of the button while the table is showing */
  export let chartLabel = "Show as chart";

  /** Specify the label of the download button */
  export let csvLabel = "Download as CSV";

  import { getContext } from "svelte";
  import Button from "../../Button/Button.svelte";
  import ChartLineSmooth from "../../icons/ChartLineSmooth.svelte";
  import Download from "../../icons/Download.svelte";
  import TableSplit from "../../icons/TableSplit.svelte";
  import { downloadFile } from "../../utils/download-file.js";
  import { groupsToCsv } from "../utils/to-csv.js";
  import { CHART_CONTEXT } from "./context.js";

  /** @type {import("./context.js").ChartContext} */
  const { groups, scales, view, setView } = getContext(CHART_CONTEXT);

  function download() {
    downloadFile(
      groupsToCsv($groups, {
        kind: $scales.kind,
        categories: $scales.categories,
      }),
      `${filename}.csv`,
      "text/csv;charset=utf-8",
    );
  }
</script>

<div class:bx--viz-chart-toolbar={true} {...$$restProps}>
  <slot />
  {#if table}
    <Button
      kind="ghost"
      size="small"
      icon={$view === "table" ? ChartLineSmooth : TableSplit}
      iconDescription={$view === "table" ? chartLabel : tableLabel}
      tooltipPosition="bottom"
      tooltipAlignment="end"
      on:click={() => setView($view === "table" ? "chart" : "table")}
    />
  {/if}
  {#if csv}
    <Button
      kind="ghost"
      size="small"
      icon={Download}
      iconDescription={csvLabel}
      tooltipPosition="bottom"
      tooltipAlignment="end"
      on:click={download}
    />
  {/if}
</div>
