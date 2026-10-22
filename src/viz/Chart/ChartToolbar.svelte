<svelte:options immutable />

<script>
  /** @restProps {div} */

  /** Set to `false` to hide the button that switches to the data table */
  export let table = true;

  /** Set to `false` to hide the CSV download button */
  export let csv = true;

  /**
   * Specify which image download to offer: a PNG at twice the pixel density,
   * an SVG, or none. The image holds the plot, the title, and the series.
   * @type {"png" | "svg" | false}
   */
  export let image = "png";

  /** Set to `false` to hide the fullscreen button */
  export let fullscreen = true;

  /** Specify the downloaded file name, without the extension */
  export let filename = "chart";

  /** Specify the label of the button while the chart is showing */
  export let tableLabel = "Show as table";

  /** Specify the label of the button while the table is showing */
  export let chartLabel = "Show as chart";

  /** Specify the label of the download button */
  export let csvLabel = "Download as CSV";

  /** Specify the label of the image download button */
  export let imageLabel = "Download as image";

  /** Specify the label of the fullscreen button */
  export let fullscreenLabel = "Show fullscreen";

  /** Specify the label of the fullscreen button while fullscreen */
  export let exitFullscreenLabel = "Exit fullscreen";

  import { getContext, onMount } from "svelte";
  import Button from "../../Button/Button.svelte";
  import ChartLineSmooth from "../../icons/ChartLineSmooth.svelte";
  import Download from "../../icons/Download.svelte";
  import ImageDownload from "../../icons/ImageDownload.svelte";
  import Maximize from "../../icons/Maximize.svelte";
  import Minimize from "../../icons/Minimize.svelte";
  import TableSplit from "../../icons/TableSplit.svelte";
  import { downloadFile } from "../../utils/download-file.js";
  import { groupsToCsv } from "../utils/to-csv.js";
  import { CHART_CONTEXT } from "./context.js";

  /** @type {import("./context.js").ChartContext} */
  const {
    groups,
    scales,
    view,
    setView,
    fullscreen: isFullscreen,
    toggleFullscreen,
    exportImage,
  } = getContext(CHART_CONTEXT);

  // Browsers without the Fullscreen API, such as Safari on iPhone, get no button.
  let canFullscreen = false;
  onMount(() => {
    canFullscreen = document.fullscreenEnabled === true;
  });

  async function downloadImage() {
    if (!image) return;
    const data = await exportImage(image);
    downloadFile(
      data,
      `${filename}.${image}`,
      image === "svg" ? "image/svg+xml;charset=utf-8" : "image/png",
    );
  }

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
  {#if image && $view === "chart"}
    <Button
      kind="ghost"
      size="small"
      icon={ImageDownload}
      iconDescription={imageLabel}
      tooltipPosition="bottom"
      tooltipAlignment="end"
      on:click={downloadImage}
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
  {#if fullscreen && canFullscreen}
    <Button
      kind="ghost"
      size="small"
      icon={$isFullscreen ? Minimize : Maximize}
      iconDescription={$isFullscreen ? exitFullscreenLabel : fullscreenLabel}
      tooltipPosition="bottom"
      tooltipAlignment="end"
      on:click={toggleFullscreen}
    />
  {/if}
</div>
