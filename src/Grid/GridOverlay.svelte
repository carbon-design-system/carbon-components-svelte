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
   * Set to `true` to mark the real glyph baseline of every line of text on the page.
   * With `baseline` set, marks on a row are green and marks off a row are red, labeled with how far they miss.
   * CSS places the glyph baseline inside the line box by font metrics, so text whose line box sits on a row usually has its baseline between rows.
   */
  export let textBaselines = false;

  /**
   * Column color, as any CSS color.
   * Replaces both the column fill (`$highlight` by default) and the column lines (`$interactive-04`).
   * @type {string | undefined}
   */
  export let color = undefined;

  /**
   * Baseline row color, as any CSS color.
   * Replaces both row colors, which default to the magenta Tag tokens.
   * @type {string | undefined}
   */
  export let baselineColor = undefined;

  import { observeBreakpoint } from "../Breakpoint/breakpoint-observer.js";
  import Column from "./Column.svelte";
  import Grid from "./Grid.svelte";
  import Row from "./Row.svelte";

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
   * @typedef {{ x: number; y: number; width: number; delta: number | null }} TextBaselineMark
   */

  // Caps the number of marks so a huge page cannot stall the overlay.
  const MAX_TEXT_MARKS = 2000;

  /** @type {TextBaselineMark[]} */
  let marks = [];

  /**
   * Distance from the top of a font's content area to its alphabetic
   * baseline. Measured once per font per pass with a zero-size
   * inline-block, whose top edge sits on the baseline.
   * @type {Map<string, number>}
   */
  const ascentCache = new Map();

  /** @param {CSSStyleDeclaration} style */
  function measureAscent(style) {
    const font = [
      style.fontStyle,
      style.fontWeight,
      style.fontStretch,
      style.fontSize,
      style.fontFamily,
    ].join(" ");
    const cached = ascentCache.get(font);
    if (cached !== undefined) return cached;

    const probe = document.createElement("span");
    probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;line-height:normal;font-style:${style.fontStyle};font-weight:${style.fontWeight};font-stretch:${style.fontStretch};font-size:${style.fontSize};font-family:${style.fontFamily}`;
    probe.textContent = "x";
    const marker = document.createElement("span");
    marker.style.cssText = "display:inline-block;width:0;height:0";
    probe.append(marker);
    document.body.append(probe);
    const ascent =
      marker.getBoundingClientRect().top - probe.getBoundingClientRect().top;
    probe.remove();
    ascentCache.set(font, ascent);
    return ascent;
  }

  /**
   * Signed distance from `y` to the nearest row, or `null` without rows.
   * @param {number} y
   * @param {number} step
   * @param {number} offset
   */
  function rowDelta(y, step, offset) {
    if (!(step > 0)) return null;
    const mod = (((y - offset) % step) + step) % step;
    const delta = mod > step / 2 ? mod - step : mod;
    return Math.round(delta * 10) / 10;
  }

  /**
   * Measures the baseline of every visible line of text outside the overlay
   * and stores the marks in page coordinates. Re-measures when the page
   * resizes, mutates, or loads fonts; scrolling only moves the layer.
   * @param {HTMLElement} node
   * @param {{ step: number; offset: number; anchor: GridOverlayBaselineAnchor }} params
   */
  function measureTextBaselines(node, params) {
    let { step, offset, anchor } = params;
    let measureFrame = 0;
    let scrollFrame = 0;
    /** @type {{ x: number; y: number; width: number }[]} */
    let measured = [];

    const applyDeltas = () => {
      // Page-anchored rows share the marks' page coordinates; viewport rows
      // are fixed on screen, so compare against the scrolled position.
      const shift = anchor === "page" ? 0 : window.scrollY;
      marks = measured.map((m) => ({
        ...m,
        delta: rowDelta(m.y - shift, step, offset),
      }));
    };

    const measure = () => {
      measureFrame = 0;
      // A font may have loaded since the last pass, changing its metrics.
      ascentCache.clear();
      /** @type {{ x: number; y: number; width: number }[]} */
      const next = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(text) {
            const parent = text.parentElement;
            if (!parent || !text.nodeValue?.trim()) {
              return NodeFilter.FILTER_REJECT;
            }
            // Skip dev tools (this overlay, LayoutInspector, DevToolbar).
            if (parent.closest("[data-ccs-devtools], script, style")) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        },
      );
      const range = document.createRange();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      for (
        let text = walker.nextNode();
        text && next.length < MAX_TEXT_MARKS;
        text = walker.nextNode()
      ) {
        const parent = /** @type {HTMLElement} */ (text.parentElement);
        const style = getComputedStyle(parent);
        if (style.visibility === "hidden") continue;
        range.selectNodeContents(text);
        const ascent = measureAscent(style);
        for (const rect of range.getClientRects()) {
          if (rect.width < 1 || rect.height < 1) continue;
          next.push({
            x: rect.left + scrollX,
            y: rect.top + scrollY + ascent,
            width: rect.width,
          });
        }
      }
      range.detach();
      measured = next;
      applyDeltas();
      onScroll();
    };

    const schedule = () => {
      if (!measureFrame) measureFrame = requestAnimationFrame(measure);
    };

    const onScroll = () => {
      scrollFrame = 0;
      node.style.setProperty(
        "--ccs-grid-overlay-text-x",
        `${-window.scrollX}px`,
      );
      node.style.setProperty(
        "--ccs-grid-overlay-text-y",
        `${-window.scrollY}px`,
      );
      if (anchor === "viewport") applyDeltas();
    };

    const scheduleScroll = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(onScroll);
    };

    // Ignore the overlay's own re-renders, or every mark would re-measure.
    const mutations = new MutationObserver((records) => {
      if (
        records.some(
          (r) =>
            !(
              r.target instanceof Element ? r.target : r.target.parentElement
            )?.closest("[data-ccs-devtools]"),
        )
      ) {
        schedule();
      }
    });
    mutations.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden"],
    });
    const resizes = new ResizeObserver(schedule);
    resizes.observe(document.documentElement);
    window.addEventListener("scroll", scheduleScroll, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    document.fonts?.ready.then(schedule);
    measure();

    return {
      /** @param {{ step: number; offset: number; anchor: GridOverlayBaselineAnchor }} next */
      update(next) {
        ({ step, offset, anchor } = next);
        applyDeltas();
      },
      destroy() {
        mutations.disconnect();
        resizes.disconnect();
        window.removeEventListener("scroll", scheduleScroll);
        window.removeEventListener("resize", schedule);
        if (measureFrame) cancelAnimationFrame(measureFrame);
        if (scrollFrame) cancelAnimationFrame(scrollFrame);
        marks = [];
      },
    };
  }

  $: onRhythm = marks.filter((m) => m.delta === 0).length;

  /** @type {import("../Breakpoint/breakpoints").BreakpointSize | undefined} */
  let size = undefined;
  let viewportWidth = 0;

  /**
   * Keeps the breakpoint badge current. Only runs while the badge renders.
   * @param {HTMLElement} _node
   */
  function trackViewport(_node) {
    const onResize = () => {
      viewportWidth = window.innerWidth;
    };
    onResize();
    window.addEventListener("resize", onResize, { passive: true });
    const stop = observeBreakpoint((next) => {
      size = next;
    });
    return {
      destroy() {
        window.removeEventListener("resize", onResize);
        stop();
      },
    };
  }

  /**
   * Places the baseline layer so its first row sits at `offset` pixels from
   * the top of the page ("page") or the viewport ("viewport"). Writes
   * custom properties directly, so scrolling never re-renders the component.
   * @param {HTMLElement} node
   * @param {{ anchor: GridOverlayBaselineAnchor; offset: number }} params
   */
  function placeBaseline(node, params) {
    let { anchor, offset } = params;
    let frame = 0;

    const update = () => {
      frame = 0;
      const shift = anchor === "page" ? offset - window.scrollY : offset;
      // Above the first row, the layer starts lower; once the first row has
      // scrolled past the top, the layer fills the viewport and the pattern
      // shifts up instead.
      node.style.setProperty(
        "--ccs-grid-overlay-baseline-top",
        `${Math.max(0, shift)}px`,
      );
      node.style.setProperty(
        "--ccs-grid-overlay-baseline-shift",
        `${Math.min(0, shift)}px`,
      );
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });

    return {
      /** @param {{ anchor: GridOverlayBaselineAnchor; offset: number }} next */
      update(next) {
        ({ anchor, offset } = next);
        update();
      },
      destroy() {
        window.removeEventListener("scroll", onScroll);
        if (frame) cancelAnimationFrame(frame);
      },
    };
  }

  $: emphasis = Math.max(1, Math.floor(baselineEmphasis) || 1);

  $: overlayClass = [
    $$restProps.class,
    "bx--grid-overlay",
    gutters && "bx--grid-overlay--gutters",
    margins && "bx--grid-overlay--margins",
  ]
    .filter(Boolean)
    .join(" ");

  $: overlayStyle = [
    $$restProps.style,
    color &&
      `--ccs-grid-overlay-fill: ${color}; --ccs-grid-overlay-ink: ${color}`,
    baselineColor &&
      `--ccs-grid-overlay-row: ${baselineColor}; --ccs-grid-overlay-row-strong: ${baselineColor}`,
  ]
    .filter(Boolean)
    .join("; ");
</script>

{#if open}
  <div
    {...$$restProps}
    class={overlayClass}
    style={overlayStyle || undefined}
    aria-hidden="true"
    data-ccs-devtools
  >
    {#if columns}
      <Grid {condensed} {narrow} {fullWidth} class="bx--grid-overlay__grid">
        <Row class="bx--grid-overlay__row">
          {#if margins}
            <span
              class="bx--grid-overlay__margin bx--grid-overlay__margin--start"
            ></span>
            <span
              class="bx--grid-overlay__margin bx--grid-overlay__margin--end"
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
        style="--ccs-grid-overlay-baseline-step: {baseline}px; --ccs-grid-overlay-baseline-major: {baseline *
          emphasis}px;"
        use:placeBaseline={{ anchor: baselineAnchor, offset: baselineOffset }}
      ></div>
    {/if}
    {#if textBaselines}
      <div
        class="bx--grid-overlay__text"
        use:measureTextBaselines={{
          step: baseline,
          offset: baselineOffset,
          anchor: baselineAnchor,
        }}
      >
        {#each marks as mark, i (i)}
          <span
            class="bx--grid-overlay__text-mark"
            class:bx--grid-overlay__text-mark--on={mark.delta === 0}
            class:bx--grid-overlay__text-mark--off={mark.delta !== null &&
              mark.delta !== 0}
            style="left: {mark.x}px; top: {mark.y}px; width: {mark.width}px;"
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
      <div class="bx--grid-overlay__label" use:trackViewport>
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
