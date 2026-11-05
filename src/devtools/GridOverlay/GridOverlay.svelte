<script>
  /**
   * @typedef {"page" | "viewport"} GridOverlayBaselineAnchor
   * @restProps {div}
   */

  /** Set to `true` to show the overlay. The caller controls this; GridOverlay never toggles its own visibility (no keyboard shortcut, no internal state). */
  export let open = false;

  /** Set to `false` to hide the columns, for example to show only the baseline rows. */
  export let columns = true;

  /** Set to `true` to match a condensed Grid. */
  export let condensed = false;

  /** Set to `true` to match a narrow Grid. */
  export let narrow = false;

  /** Set to `true` to match a fullWidth Grid. */
  export let fullWidth = false;

  /** Set to `true` to shade each column's gutter padding darker than its content area. */
  export let gutters = false;

  /** Set to `true` to hatch the grid's outer margins, the area outside the outermost columns. */
  export let margins = false;

  /** Set to `true` to number each column at the top of the viewport. */
  export let numbers = false;

  /** Set to `true` to show a badge with the current breakpoint, column count, and viewport width. */
  export let label = false;

  /**
   * Distance in pixels between baseline rows.
   * Set to `8` to match Carbon's mini unit, or `4` to check type.
   * `0` hides the rows.
   */
  export let baseline = 0;

  /**
   * Draw every Nth baseline row stronger, so the rhythm is easier to read.
   * For example, `4` with an 8px `baseline` marks every 32px.
   * `0` or `1` draws every row the same.
   */
  export let baselineEmphasis = 4;

  /**
   * Distance in pixels from the top of the page (or viewport) to the first baseline row.
   * For example, `48` starts the rhythm below a UI Shell `Header`.
   */
  export let baselineOffset = 0;

  /**
   * What the baseline rows are anchored to.
   * `"page"` moves the rows with the document as it scrolls, so they stay on the same content.
   * `"viewport"` keeps the rows still while the content scrolls under them.
   * @type {GridOverlayBaselineAnchor}
   */
  export let baselineAnchor = "page";

  /**
   * Set to `true` to mark the real glyph baseline of every line of text near the viewport (the visible area and one screen above and below).
   * With `baseline` set, marks on a row are green and marks off a row are red, labeled with how far they miss.
   * CSS places the glyph baseline inside the line box by font metrics, so text whose line box sits on a row usually has its baseline between rows.
   */
  export let textBaselines = false;

  import { observeBreakpoint } from "../../Breakpoint/breakpoint-observer.js";
  import Column from "../../Grid/Column.svelte";
  import Grid from "../../Grid/Grid.svelte";
  import Row from "../../Grid/Row.svelte";
  import { createFrameJob } from "../../utils/frame-batch.js";
  import { addPooledListener } from "../../utils/window-listener-pool.js";
  import { measureBaselines } from "../baselines.js";
  import { rowDelta } from "../geometry.js";
  import { observePage } from "../page-scan.js";

  // 16 slots cover every breakpoint's column count (sm: 4, md: 8, lg/xlg/max: 16).
  // Each slot hides itself (span 0) once its index passes that breakpoint's
  // column count, and always shows (span 1) at lg/xlg/max, which are all
  // 16-column in this library's build (css/all.scss sets grid-columns-16: true).
  const SLOTS = Array.from({ length: 16 }, (_, i) => ({
    sm: i < 4 ? 1 : 0,
    md: i < 8 ? 1 : 0,
    lg: 1,
    xlg: 1,
    max: 1,
  }));

  const COLUMN_COUNT = { sm: 4, md: 8, lg: 16, xlg: 16, max: 16 };

  /**
   * @typedef {{ key: string; x: number; y: number; width: number; rtl: boolean; pinned: boolean }} MeasuredLine
   * @typedef {MeasuredLine & { delta: number | null }} TextBaselineMark
   */

  /** @type {TextBaselineMark[]} */
  let marks = [];

  /**
   * @param {MeasuredLine[]} a
   * @param {MeasuredLine[]} b
   */
  function sameLines(a, b) {
    return (
      a.length === b.length &&
      a.every(
        (line, i) =>
          line.key === b[i].key &&
          line.rtl === b[i].rtl &&
          line.pinned === b[i].pinned,
      )
    );
  }

  /**
   * Measures the baseline of every line of text near the viewport, outside
   * the dev tools, and stores the marks in page coordinates. Measures again
   * when the page changes or scrolls far; scrolling only moves the layer.
   * Marks that did not move keep their DOM nodes.
   * @param {HTMLElement} node
   * @param {{ step: number; offset: number; anchor: GridOverlayBaselineAnchor }} options
   */
  function measureTextBaselines(node, options) {
    let { step, offset, anchor } = options;
    /** @type {MeasuredLine[]} */
    let measured = [];

    function applyDeltas() {
      // Page-anchored rows share the marks' page coordinates; viewport rows
      // are fixed on screen, so compare against the scrolled position.
      // Pinned marks are in viewport coordinates already.
      const scrollY = window.scrollY;
      marks = measured.map((line) => {
        const pageY = line.pinned ? line.y + scrollY : line.y;
        return {
          ...line,
          delta: rowDelta(
            anchor === "page" ? pageY : pageY - scrollY,
            step,
            offset,
          ),
        };
      });
    }

    /** @param {import("../page-scan.js").ScanBand} band */
    function measure(band) {
      /** @type {Map<string, number>} */
      const seen = new Map();
      /** @type {MeasuredLine[]} */
      const next = measureBaselines({ host: node, band }).map((line) => {
        const base = `${line.pinned}|${line.x}|${line.y}|${line.width}`;
        const count = seen.get(base) ?? 0;
        seen.set(base, count + 1);
        return {
          key: count ? `${base}|${count}` : base,
          x: line.x,
          y: line.y,
          width: line.width,
          rtl: line.rtl,
          pinned: line.pinned,
        };
      });
      if (sameLines(measured, next)) return;
      measured = next;
      applyDeltas();
    }

    const scroll = createFrameJob([
      () => [window.scrollX, window.scrollY],
      (/** @type {[number, number]} */ [x, y]) => {
        node.style.setProperty("--ccs-grid-overlay-text-x", `${-x}px`);
        node.style.setProperty("--ccs-grid-overlay-text-y", `${-y}px`);
        // Viewport rows move against page marks, and page rows move
        // against pinned marks.
        if (anchor === "viewport" || measured.some((line) => line.pinned)) {
          applyDeltas();
        }
      },
    ]);
    const page = observePage(measure, { onScroll: scroll.schedule });
    scroll.schedule();

    return {
      /** @param {{ step: number; offset: number; anchor: GridOverlayBaselineAnchor }} next */
      update(next) {
        ({ step, offset, anchor } = next);
        applyDeltas();
      },
      destroy() {
        page.destroy();
        scroll.cancel();
        marks = [];
      },
    };
  }

  $: onRhythm = marks.filter((mark) => mark.delta === 0).length;
  $: pageMarks = marks.filter((mark) => !mark.pinned);
  $: pinnedMarks = marks.filter((mark) => mark.pinned);

  /** @type {import("../../Breakpoint/breakpoints").BreakpointSize | undefined} */
  let size;
  let viewportWidth = 0;

  /**
   * Keeps the breakpoint badge current. Only runs while the badge renders.
   * @param {HTMLElement} _node
   */
  function trackViewport(_node) {
    function handleResize() {
      viewportWidth = window.innerWidth;
    }
    handleResize();
    const stopResize = addPooledListener("resize", handleResize, {
      passive: true,
    });
    const stopBreakpoint = observeBreakpoint((next) => {
      size = next;
    });
    return {
      destroy() {
        stopResize();
        stopBreakpoint();
      },
    };
  }

  /**
   * Places the baseline layer so its first row sits at `offset` pixels from
   * the top of the page ("page") or the viewport ("viewport"). Writes
   * custom properties directly, so scrolling never re-renders the component.
   * @param {HTMLElement} node
   * @param {{ anchor: GridOverlayBaselineAnchor; offset: number }} options
   */
  function placeBaseline(node, options) {
    let { anchor, offset } = options;

    const job = createFrameJob([
      () => (anchor === "page" ? offset - window.scrollY : offset),
      (/** @type {number} */ shift) => {
        // Above the first row, the layer starts lower; once the first row
        // has scrolled past the top, the layer fills the viewport and the
        // pattern shifts up instead.
        node.style.setProperty(
          "--ccs-grid-overlay-baseline-top",
          `${Math.max(0, shift)}px`,
        );
        node.style.setProperty(
          "--ccs-grid-overlay-baseline-shift",
          `${Math.min(0, shift)}px`,
        );
      },
    ]);

    job.schedule();
    const stopScroll = addPooledListener("scroll", job.schedule, {
      passive: true,
    });

    return {
      /** @param {{ anchor: GridOverlayBaselineAnchor; offset: number }} next */
      update(next) {
        ({ anchor, offset } = next);
        job.schedule();
      },
      destroy() {
        stopScroll();
        job.cancel();
      },
    };
  }

  $: emphasis = Math.max(1, Math.floor(baselineEmphasis) || 1);
</script>

{#if open}
  <div
    {...$$restProps}
    class:bx--grid-overlay={true}
    class:bx--grid-overlay--gutters={gutters}
    class:bx--grid-overlay--margins={margins}
    aria-hidden="true"
    data-ccs-dev-tool
  >
    {#if columns}
      <Grid {condensed} {narrow} {fullWidth} class="bx--grid-overlay__grid">
        <Row class="bx--grid-overlay__row">
          {#if margins}
            <span
              class="bx--grid-overlay__margin bx--grid-overlay__margin--start"
            ></span>
            <span class="bx--grid-overlay__margin bx--grid-overlay__margin--end"
            ></span>
          {/if}
          {#each SLOTS as slot, i (i)}
            <Column
              sm={slot.sm}
              md={slot.md}
              lg={slot.lg}
              xlg={slot.xlg}
              max={slot.max}
              class="bx--grid-overlay__col"
            >
              {#if numbers}
                <span class="bx--grid-overlay__number">{i + 1}</span>
              {/if}
            </Column>
          {/each}
        </Row>
      </Grid>
    {/if}
    {#if baseline > 0}
      <div
        class="bx--grid-overlay__baseline"
        style:--ccs-grid-overlay-baseline-step="{baseline}px"
        style:--ccs-grid-overlay-baseline-major="{baseline * emphasis}px"
        use:placeBaseline={{ anchor: baselineAnchor, offset: baselineOffset }}
      ></div>
    {/if}
    {#if textBaselines}
      <!-- dir="ltr": offset labels like "+2" must not reorder on an RTL
           page; each label picks its side from its own text instead. -->
      <div
        class="bx--grid-overlay__text"
        dir="ltr"
        use:measureTextBaselines={{
          step: baseline,
          offset: baselineOffset,
          anchor: baselineAnchor,
        }}
      >
        {#each pageMarks as mark (mark.key)}
          <span
            class="bx--grid-overlay__text-mark"
            class:bx--grid-overlay__text-mark--on={mark.delta === 0}
            class:bx--grid-overlay__text-mark--off={mark.delta !== null &&
              mark.delta !== 0}
            class:bx--grid-overlay__text-mark--rtl={mark.rtl}
            style:left="{mark.x}px"
            style:top="{mark.y}px"
            style:width="{mark.width}px"
          >
            {#if mark.delta}
              <span class="bx--grid-overlay__text-delta"
                >{mark.delta > 0 ? "+" : ""}{mark.delta}</span
              >
            {/if}
          </span>
        {/each}
      </div>
      <div
        class="bx--grid-overlay__text bx--grid-overlay__text--pinned"
        dir="ltr"
      >
        {#each pinnedMarks as mark (mark.key)}
          <span
            class="bx--grid-overlay__text-mark"
            class:bx--grid-overlay__text-mark--on={mark.delta === 0}
            class:bx--grid-overlay__text-mark--off={mark.delta !== null &&
              mark.delta !== 0}
            class:bx--grid-overlay__text-mark--rtl={mark.rtl}
            style:left="{mark.x}px"
            style:top="{mark.y}px"
            style:width="{mark.width}px"
          >
            {#if mark.delta}
              <span class="bx--grid-overlay__text-delta"
                >{mark.delta > 0 ? "+" : ""}{mark.delta}</span
              >
            {/if}
          </span>
        {/each}
      </div>
    {/if}
    {#if label}
      <!-- dir="ltr": "1100px" and "8px rows" must not reorder on an RTL
           page. The grid itself follows the page, so column 1 sits at the
           inline start. -->
      <div class="bx--grid-overlay__label" dir="ltr" use:trackViewport>
        {#if size}
          <strong>{size}</strong>
          <span>{COLUMN_COUNT[size]} columns</span>
        {/if}
        <span>{viewportWidth}px</span>
        {#if baseline > 0}
          <span>{baseline}px rows</span>
        {/if}
        {#if textBaselines && baseline > 0 && marks.length}
          <span>{onRhythm}/{marks.length} lines on a row</span>
        {/if}
      </div>
    {/if}
  </div>
{/if}
