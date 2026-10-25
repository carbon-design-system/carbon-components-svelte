<svelte:options immutable />

<script>
  /**
   * @event {{ kind: "image" | "csv" | "copy"; error: unknown }} export:error Fires when a download or a copy could not be produced, such as an image from a tainted canvas.
   * @event {{ format: "csv" | "tsv" | "json"; rows: number }} copy Fires when the shown data has been copied to the clipboard.
   * @event {null} copy:image Fires when the plot has been copied to the clipboard as a PNG.
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
   * Set to `true` to show a button that copies the plot to the clipboard as
   * a PNG. Needs a secure context and a browser with `ClipboardItem`; the
   * button stays out otherwise.
   */
  export let copyImage = false;

  /** Set to `true` to show a button that prints the page */
  export let print = false;

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

  /** Specify the label of the copy image button */
  export let copyImageLabel = "Copy image";

  /** Specify the label of the print button */
  export let printLabel = "Print";

  /** Specify the label of the fullscreen button */
  export let fullscreenLabel = "Show fullscreen";

  /** Specify the label of the fullscreen button while fullscreen */
  export let exitFullscreenLabel = "Exit fullscreen";

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import Button from "../../Button/Button.svelte";
  import ChartLineSmooth from "../../icons/ChartLineSmooth.svelte";
  import Copy from "../../icons/Copy.svelte";
  import Download from "../../icons/Download.svelte";
  import ImageCopy from "../../icons/ImageCopy.svelte";
  import ImageDownload from "../../icons/ImageDownload.svelte";
  import Maximize from "../../icons/Maximize.svelte";
  import Minimize from "../../icons/Minimize.svelte";
  import Printer from "../../icons/Printer.svelte";
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
    fullscreen: isFullscreen,
    toggleFullscreen,
    exportImage,
  } = getContext(CHART_CONTEXT);

  // Browsers without the Fullscreen API, such as Safari on iPhone, get no button.
  let canFullscreen = false;
  let canCopyImage = false;
  onMount(() => {
    canFullscreen = document.fullscreenEnabled === true;
    canCopyImage =
      typeof ClipboardItem === "function" &&
      typeof navigator.clipboard?.write === "function";
  });

  async function copyPlot() {
    try {
      // Safari wants the blob as a promise, and the promise made at once.
      const blob = exportImage("png");
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": /** @type {Promise<Blob>} */ (blob) }),
      ]);
      dispatch("copy:image", null);
    } catch (error) {
      dispatch("export:error", { kind: "copy", error });
    }
  }

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
  {#if copyImage && canCopyImage && $view === "chart"}
    <Button
      kind="ghost"
      size="small"
      icon={ImageCopy}
      iconDescription={copyImageLabel}
      tooltipPosition="bottom"
      tooltipAlignment="end"
      on:click={copyPlot}
    />
  {/if}
  {#if print}
    <Button
      kind="ghost"
      size="small"
      icon={Printer}
      iconDescription={printLabel}
      tooltipPosition="bottom"
      tooltipAlignment="end"
      on:click={() => window.print()}
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
