<svelte:options immutable />

<script>
  /**
   * @event {{ kind: "image" | "csv" | "copy"; error: unknown }} export:error Fires when a download or a copy could not be produced, such as an image from a tainted canvas.
   * @event {{ format: "csv" | "tsv" | "json"; rows: number }} copy Fires when the shown data has been copied to the clipboard.
   * @event {null} reset Fires when the zoom, brush, and selection have been reset from the toolbar.
   */

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

  /**
   * Set to `true` to show a button that copies what the chart shows to the
   * clipboard, as `copyFormat`: the series that are not hidden, within the
   * zoom window.
   */
  export let copy = false;

  /**
   * Specify what the copy button writes: CSV, tab-separated values, which
   * paste into a spreadsheet as cells, or JSON rows of `x`, `series`, `y`.
   * @type {"csv" | "tsv" | "json"}
   */
  export let copyFormat = "tsv";

  /**
   * Set to `false` to hide the reset button. It shows only while a zoom, a
   * brush, or a selection is set, and clears all three.
   */
  export let reset = true;

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

  /** Specify the label of the copy button */
  export let copyLabel = "Copy data";

  /** Specify the label of the copy button for a moment after a copy */
  export let copiedLabel = "Copied";

  /** Specify the label of the reset button */
  export let resetLabel = "Reset zoom and selection";

  /** Specify the label of the fullscreen button */
  export let fullscreenLabel = "Show fullscreen";

  /** Specify the label of the fullscreen button while fullscreen */
  export let exitFullscreenLabel = "Exit fullscreen";

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import Button from "../../Button/Button.svelte";
  import ChartLineSmooth from "../../icons/ChartLineSmooth.svelte";
  import Copy from "../../icons/Copy.svelte";
  import Download from "../../icons/Download.svelte";
  import ImageDownload from "../../icons/ImageDownload.svelte";
  import Maximize from "../../icons/Maximize.svelte";
  import Minimize from "../../icons/Minimize.svelte";
  import Reset from "../../icons/Reset.svelte";
  import TableSplit from "../../icons/TableSplit.svelte";
  import { copyText } from "../../utils/copy-text.js";
  import { downloadFile } from "../../utils/download-file.js";
  import { groupsToCsv, groupsToRows } from "../utils/to-csv.js";
  import { CHART_CONTEXT } from "./context.js";

  const dispatch = createEventDispatcher();

  /** @type {import("./context.js").ChartContext} */
  const {
    groups,
    scales,
    view,
    setView,
    zoom,
    setZoom,
    brush,
    setBrush,
    selectedKeys,
    clearSelection,
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
    try {
      const data = await exportImage(image);
      downloadFile(
        data,
        `${filename}.${image}`,
        image === "svg" ? "image/svg+xml;charset=utf-8" : "image/png",
      );
    } catch (error) {
      dispatch("export:error", { kind: "image", error });
    }
  }

  /** Whether anything is set that the reset button would clear. */
  $: resettable = $zoom !== null || $brush !== null || $selectedKeys.size > 0;

  function resetAll() {
    if ($zoom !== null) setZoom(null);
    if ($brush !== null) setBrush(null);
    if ($selectedKeys.size > 0) clearSelection();
    dispatch("reset", null);
  }

  let copied = false;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let copiedTimer;
  onMount(() => () => clearTimeout(copiedTimer));

  async function copyData() {
    const options = {
      kind: $scales.kind,
      categories: $scales.categories,
      range: $zoom,
    };
    try {
      const rows = groupsToRows($groups, options);
      const text =
        copyFormat === "json"
          ? JSON.stringify(rows, null, 2)
          : groupsToCsv($groups, {
              ...options,
              delimiter: copyFormat === "tsv" ? "\t" : ",",
            });
      await copyText(text);
      copied = true;
      clearTimeout(copiedTimer);
      copiedTimer = setTimeout(() => {
        copied = false;
      }, 2000);
      dispatch("copy", { format: copyFormat, rows: rows.length });
    } catch (error) {
      dispatch("export:error", { kind: "copy", error });
    }
  }

  function download() {
    try {
      downloadFile(
        groupsToCsv($groups, {
          kind: $scales.kind,
          categories: $scales.categories,
          range: $zoom,
        }),
        `${filename}.csv`,
        "text/csv;charset=utf-8",
      );
    } catch (error) {
      dispatch("export:error", { kind: "csv", error });
    }
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
  {#if copy}
    <Button
      kind="ghost"
      size="small"
      icon={Copy}
      iconDescription={copied ? copiedLabel : copyLabel}
      tooltipPosition="bottom"
      tooltipAlignment="end"
      on:click={copyData}
    />
  {/if}
  {#if reset && resettable}
    <Button
      kind="ghost"
      size="small"
      icon={Reset}
      iconDescription={resetLabel}
      tooltipPosition="bottom"
      tooltipAlignment="end"
      on:click={resetAll}
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
