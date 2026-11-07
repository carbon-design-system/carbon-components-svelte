<script>
  /**
   * @event {null} ready
   * @event {{ reason: "unreadable" }} fallback
   */

  /**
   * Specify the file to show.
   * @type {import("../file-preview.js").PreviewFile}
   */
  export let file;

  /**
   * Specify what the renderer is given.
   * @type {import("../file-preview.js").PreviewOptions}
   */
  export let options;

  import { createEventDispatcher } from "svelte";
  import Button from "../../Button/Button.svelte";
  import ZoomIn from "../../icons/ZoomIn.svelte";
  import ZoomOut from "../../icons/ZoomOut.svelte";
  import ZoomReset from "../../icons/ZoomReset.svelte";

  const dispatch = createEventDispatcher();

  // Zoom is a share of the image's own size. `null` fits the image to the
  // box, which is where it starts.
  const STEPS = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 8];

  /** @type {HTMLImageElement | undefined} */
  let image;
  /** @type {number | null} */
  let scale = null;
  let naturalWidth = 0;

  // An SVG without a size reports 0; the browser draws it at 300 wide.
  $: baseWidth = naturalWidth || 300;

  function ready() {
    naturalWidth = image?.naturalWidth ?? 0;
    dispatch("ready");
  }

  /** @param {1 | -1} direction */
  function zoom(direction) {
    const current =
      scale ?? (image ? image.getBoundingClientRect().width / baseWidth : 1);
    const next =
      direction > 0
        ? STEPS.find((step) => step > current * 1.001)
        : [...STEPS].reverse().find((step) => step < current * 0.999);
    if (next !== undefined) scale = next;
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoom(1);
    } else if (event.key === "-") {
      event.preventDefault();
      zoom(-1);
    } else if (event.key === "0") {
      event.preventDefault();
      scale = null;
    }
  }
</script>

<div class:bx--file-preview__image={true}>
  <!-- svelte-ignore a11y-no-noninteractive-tabindex a11y_no_noninteractive_element_interactions -->
  <div
    class:bx--file-preview__viewport={true}
    class:bx--file-preview__viewport--fit={scale === null}
    role="group"
    aria-label={file.name}
    tabindex="0"
    on:keydown={handleKeydown}
  >
    <img
      bind:this={image}
      src={file.url}
      alt={file.name}
      decoding="async"
      style:width={scale === null ? undefined : `${baseWidth * scale}px`}
      on:load={ready}
      on:error={() => dispatch("fallback", { reason: "unreadable" })}
    />
  </div>
  <div class:bx--file-preview__zoom={true}>
    <Button
      kind="ghost"
      size="sm"
      icon={ZoomOut}
      iconDescription={options.texts.zoomOut}
      tooltipAlign="top"
      on:click={() => zoom(-1)}
    />
    <Button
      kind="ghost"
      size="sm"
      icon={ZoomReset}
      iconDescription={options.texts.zoomFit}
      tooltipAlign="top"
      on:click={() => (scale = null)}
    />
    <Button
      kind="ghost"
      size="sm"
      icon={ZoomIn}
      iconDescription={options.texts.zoomIn}
      tooltipAlign="top"
      on:click={() => zoom(1)}
    />
  </div>
</div>
