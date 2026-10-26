<script>
  /**
   * @typedef {"spacing" | "contrast" | "targets" | "overflow"} LayoutInspectorCheck
   * @typedef {{ key: string; check: LayoutInspectorCheck; x: number; y: number; width: number; height: number; text: string; label: string | null; pinned: boolean }} LayoutInspectorMark
   * @restProps {div}
   */

  /** Set to `true` to turn the inspector on. The caller controls this; LayoutInspector never toggles its own visibility. */
  export let open = false;

  /** Set to `false` to stop drawing the margin, padding, and content boxes of the element under the pointer. */
  export let spacing = true;

  /** Set to `false` to turn off measuring. When on, hover an element, hold `measureKey`, then hover another element to see the distances between them. */
  export let measure = true;

  /**
   * Key to hold while measuring.
   * `"Alt"` is the Option (⌥) key on macOS.
   * Use `"Shift"` on keyboards without Alt or Option, or if Alt shortcuts in your app get in the way.
   * @type {"Alt" | "Shift" | "Control" | "Meta"}
   */
  export let measureKey = "Alt";

  /**
   * Where the info card goes.
   * `"cursor"` follows the pointer and flips away from viewport edges.
   * `"corner"` docks it in the bottom-right corner, moving it to the bottom-left while the pointer is near.
   * @type {"cursor" | "corner"}
   */
  export let cardPlacement = "cursor";

  /** Set to `false` to hide the Carbon type token of hovered text. */
  export let typography = true;

  /**
   * Set to `false` to hide colors from the card.
   * When on, the card shows the hovered element's text, background, and border colors with their Carbon theme token names, and the WCAG contrast of its text.
   */
  export let colors = true;

  /** Set to `true` to outline every element whose margin, padding, or gap is not a Carbon spacing token. */
  export let checkSpacing = false;

  /** Set to `true` to outline all text whose contrast against its background is below WCAG AA. */
  export let checkContrast = false;

  /**
   * Set to `true` to outline every interactive element that fails WCAG 2.2 target size (2.5.8).
   * A target fails when it is smaller than `targetSize` in either dimension and a `targetSize` circle centered on it would touch another target, or another small target's circle.
   */
  export let checkTargets = false;

  /** Set to `true` to outline elements that push the page into horizontal scroll, and content clipped or truncated by `overflow: hidden`. */
  export let checkOverflow = false;

  /**
   * Set to `true` to check Carbon's own components too.
   * By default, the checks skip elements with a `bx--` class and their unstyled inner elements (such as the `<input>` inside `NumberInput`), so only your code is checked.
   * Turn it on to check a custom theme.
   */
  export let checkCarbon = false;

  /** CSS selector for elements the checks skip, along with everything inside them, for example third-party widgets. */
  export let checkIgnore = "";

  /**
   * Minimum target size in pixels for `checkTargets`.
   * `24` is the WCAG 2.2 AA minimum (2.5.8); `44` is the AAA size (2.5.5).
   */
  export let targetSize = 24;

  /**
   * Delay in milliseconds before the box model first appears.
   * The pointer must rest on one element this long, so sweeping across the page does not flash the overlay.
   * Once it shows, moving to another element updates it at once, like a `TooltipGroup`.
   * `0` shows it at once.
   */
  export let enterDelayMs = 150;

  /** Delay in milliseconds before the box model hides once the pointer leaves every element. */
  export let leaveDelayMs = 100;

  /** How long in milliseconds after the box model hides that it still comes back at once. */
  export let skipDelayMs = 300;

  import { tick } from "svelte";
  import { createDelayedSetter } from "../../utils/delayed-setter.js";
  import { createFrameJob } from "../../utils/frame-batch.js";
  import { addPooledListener } from "../../utils/window-listener-pool.js";
  import { AUDIT_CHECKS, formatRatio, runChecks } from "../audit.js";
  import {
    boxes,
    distanceSegments,
    mergeLabels,
    ringLabels,
  } from "../geometry.js";
  import { inspectElement, resetTypeTable } from "../inspect.js";
  import { createLayerLookup, DEV_TOOL, observePage } from "../page-scan.js";
  import {
    formatPx,
    paddingToken,
    sideTokens,
    spacingToken,
  } from "../spacing.js";

  /** Root font size in px, read again on every hover and scan. */
  let remPx = 16;

  function readRemPx() {
    remPx =
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
      16;
  }

  // ---------------------------------------------------------------------
  // Hover: box model, type, and measuring

  /** @type {Element | null} */
  let hovered = null;
  /** @type {Element | null} */
  let anchor = null;
  let measuring = false;

  /** Pointer position in viewport coordinates, for the cursor card. */
  let pointerX = 0;
  let pointerY = 0;

  /** @type {HTMLElement | null} */
  let cardRef = null;

  // Which side of the pointer the card sits on. Flipping has hysteresis
  // (see `cardPosition`), so the card does not flip back and forth at an
  // edge.
  let flipX = false;
  let flipY = false;
  let cornerLeft = false;

  const KEY_LABELS = {
    Alt: "Alt / ⌥",
    Shift: "Shift",
    Control: "Ctrl",
    Meta: "⌘ / Win",
  };

  const CARD_GAP = 16;
  const CARD_EDGE = 8;
  const FLIP_SLACK = 48;

  /**
   * Where the single, reused card goes. "cursor" sits below-right of the
   * pointer and flips to the other side when it would cross a viewport
   * edge; it flips back only once there is `FLIP_SLACK` more room, so it
   * does not jitter at the edge. "corner" docks bottom-right and moves
   * bottom-left while the pointer is over its spot. Reads layout only.
   * @returns {{ left: number; top: number } | null}
   */
  function cardPosition() {
    if (!cardRef) return null;
    const w = cardRef.offsetWidth;
    const h = cardRef.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    let left;
    let top;

    if (cardPlacement === "corner") {
      const near = (/** @type {number} */ x) =>
        pointerX >= x - CARD_GAP &&
        pointerX <= x + w + CARD_GAP &&
        pointerY >= vh - h - CARD_EDGE - CARD_GAP;
      const rightX = vw - w - CARD_EDGE;
      if (!cornerLeft && near(rightX)) cornerLeft = true;
      else if (cornerLeft && near(CARD_EDGE)) cornerLeft = false;
      left = cornerLeft ? CARD_EDGE : rightX;
      top = vh - h - CARD_EDGE;
    } else {
      const roomRight = vw - CARD_EDGE - (pointerX + CARD_GAP + w);
      const roomBelow = vh - CARD_EDGE - (pointerY + CARD_GAP + h);
      if (!flipX && roomRight < 0) flipX = true;
      else if (flipX && roomRight > FLIP_SLACK) flipX = false;
      if (!flipY && roomBelow < 0) flipY = true;
      else if (flipY && roomBelow > FLIP_SLACK) flipY = false;
      left = flipX ? pointerX - CARD_GAP - w : pointerX + CARD_GAP;
      top = flipY ? pointerY - CARD_GAP - h : pointerY + CARD_GAP;
    }

    return {
      left: Math.round(Math.max(CARD_EDGE, Math.min(left, vw - w - CARD_EDGE))),
      top: Math.round(Math.max(CARD_EDGE, Math.min(top, vh - h - CARD_EDGE))),
    };
  }

  /**
   * Moves the card with a transform, without a re-render.
   * @param {{ left: number; top: number } | null} position
   */
  function moveCard(position) {
    if (!cardRef || !position) return;
    cardRef.style.transform = `translate(${position.left}px, ${position.top}px)`;
    // Hidden until first placed, so it never flashes at the top-left.
    cardRef.style.visibility = "visible";
  }

  /**
   * @typedef {import("../geometry.js").Box} Box
   * @typedef {import("../geometry.js").SideLabel} SideLabel
   * @typedef {import("../geometry.js").Segment} Segment
   */

  /** @type {null | { rect: DOMRect; marginBox: Box; marginWidths: number[]; paddingBox: Box; paddingWidths: number[]; contentBox: Box; labels: (SideLabel & { kind: "margin" | "padding"; off: boolean })[]; info: { name: string; size: string; margin: number[]; padding: number[]; border: number[]; carbon: boolean; gap: { row: number; column: number } | null; type: string[] | null; typeSpec: string; colors: import("../inspect.js").ColorInfo | null } }} */
  let hover = null;

  /** @type {null | { a: DOMRect; b: DOMRect; segments: (Segment & { token: string | null })[] }} */
  let distance = null;

  function updateHover() {
    readRemPx();

    if (
      measure &&
      measuring &&
      anchor &&
      hovered &&
      anchor !== hovered &&
      anchor.isConnected
    ) {
      const a = anchor.getBoundingClientRect();
      const b = hovered.getBoundingClientRect();
      distance = {
        a,
        b,
        segments: distanceSegments(a, b).map((segment) => ({
          ...segment,
          token: spacingToken(segment.value, remPx),
        })),
      };
      hover = null;
      return;
    }

    distance = null;
    if (!hovered?.isConnected || (!spacing && !typography && !colors)) {
      hover = null;
      return;
    }

    const { rect, info } = inspectElement(hovered, {
      checkCarbon,
      typography,
      colors,
    });
    const { margin, border, padding, carbon } = info;
    const { marginBox, paddingBox, contentBox, marginWidths } = boxes(
      rect,
      margin,
      border,
      padding,
    );
    const sideIndex = ["top", "right", "bottom", "left"];

    hover = {
      rect,
      marginBox,
      marginWidths,
      paddingBox,
      paddingWidths: padding,
      contentBox,
      labels: spacing
        ? [
            ...ringLabels(marginBox, rect, margin).map((label) => ({
              ...label,
              kind: /** @type {const} */ ("margin"),
              off: !carbon && spacingToken(label.value, remPx) === null,
            })),
            ...ringLabels(paddingBox, contentBox, padding).map((label) => ({
              ...label,
              kind: /** @type {const} */ ("padding"),
              off:
                !carbon &&
                paddingToken(
                  label.value,
                  border[sideIndex.indexOf(label.side)],
                  remPx,
                ).token === null,
            })),
          ]
        : [],
      info,
    };
  }

  /**
   * Tracks the pointer and the measure key while the inspector is open.
   * The overlay is `pointer-events: none`, so the page stays fully usable
   * and `event.target` is always a page element.
   * @param {HTMLElement} _node
   */
  function trackPointer(_node) {
    // Reads the hovered element, then places the card once its new
    // content has rendered.
    const hoverJob = createFrameJob([
      () => {
        updateHover();
        tick().then(() => moveCard(cardPosition()));
      },
    ]);
    const cardJob = createFrameJob([cardPosition, moveCard]);
    const enterDelay = createDelayedSetter();
    const leaveDelay = createDelayedSetter();

    /** Element under the pointer, shown or not. */
    /** @type {Element | null} */
    let pointerTarget = null;
    let shown = false;
    let leaving = false;
    let hiddenAt = Number.NEGATIVE_INFINITY;

    function show() {
      shown = true;
      hovered = pointerTarget;
      hoverJob.schedule();
    }

    function hide() {
      leaving = false;
      shown = false;
      hiddenAt = performance.now();
      hovered = null;
      hoverJob.schedule();
    }

    /**
     * Follows TooltipGroup timing: the first element shows after the
     * pointer rests for `enterDelayMs`; while shown, moving to another
     * element is instant; leaving every element hides after
     * `leaveDelayMs`; coming back within `skipDelayMs` is instant again.
     * @param {Element | null} target
     */
    function point(target) {
      if (target === pointerTarget) return;
      pointerTarget = target;

      // Measuring tracks the pointer with no delay.
      if (measuring) {
        hovered = target;
        hoverJob.schedule();
        return;
      }

      if (target) {
        leaveDelay.cancel();
        leaving = false;
        if (shown) {
          hovered = target;
          hoverJob.schedule();
        } else if (performance.now() - hiddenAt < skipDelayMs) {
          enterDelay(0, show);
        } else {
          // Restarts on every new element, so only a resting pointer shows.
          enterDelay(enterDelayMs, show);
        }
      } else {
        enterDelay.cancel();
        if (shown && !leaving) {
          leaving = true;
          leaveDelay(leaveDelayMs, hide);
        }
      }
    }

    /** @param {Event} event */
    function handlePointermove(event) {
      const { clientX, clientY, target } = /** @type {PointerEvent} */ (event);
      pointerX = clientX;
      pointerY = clientY;
      cardJob.schedule();
      point(
        target instanceof Element &&
          target !== document.documentElement &&
          target !== document.body &&
          !target.closest(DEV_TOOL)
          ? target
          : null,
      );
    }

    /** @param {Event} event */
    function handlePointerout(event) {
      // No related target: the pointer left the document.
      if (!(/** @type {PointerEvent} */ (event).relatedTarget)) point(null);
    }

    /** @param {Event} event */
    function handleKeydown(event) {
      const { key } = /** @type {KeyboardEvent} */ (event);
      if (!measure || key !== measureKey || measuring) return;
      measuring = true;
      anchor = hovered ?? pointerTarget;
      hovered = pointerTarget;
      hoverJob.schedule();
    }

    /** @param {Event} event */
    function handleKeyup(event) {
      const { key } = /** @type {KeyboardEvent} */ (event);
      if (key !== measureKey || !measuring) return;
      measuring = false;
      anchor = null;
      // Back to the box model of what is under the pointer, at once.
      shown = pointerTarget !== null;
      hovered = pointerTarget;
      hoverJob.schedule();
    }

    function handleBlur() {
      measuring = false;
      anchor = null;
      hoverJob.schedule();
    }

    function handleResize() {
      resetTypeTable();
      hoverJob.schedule();
    }

    const cleanups = [
      addPooledListener("pointermove", handlePointermove, {
        passive: true,
        capture: true,
      }),
      addPooledListener("pointerout", handlePointerout, { passive: true }),
      addPooledListener("keydown", handleKeydown),
      addPooledListener("keyup", handleKeyup),
      addPooledListener("blur", handleBlur),
      addPooledListener("scroll", hoverJob.schedule, {
        passive: true,
        capture: true,
      }),
      addPooledListener("resize", handleResize, { passive: true }),
    ];

    return {
      destroy() {
        for (const cleanup of cleanups) cleanup();
        hoverJob.cancel();
        cardJob.cancel();
        enterDelay.cancel();
        leaveDelay.cancel();
        hovered = null;
        anchor = null;
        measuring = false;
        hover = null;
        distance = null;
      },
    };
  }

  // ---------------------------------------------------------------------
  // Page checks

  /** @type {Record<LayoutInspectorCheck, LayoutInspectorMark[]>} */
  let found = { spacing: [], contrast: [], targets: [], overflow: [] };

  $: allMarks = [
    ...found.spacing,
    ...found.targets,
    ...found.contrast,
    ...found.overflow,
  ];
  // Marks on fixed boxes, such as a UI Shell header, stay put while the
  // page scrolls; the rest scroll with the page.
  $: pageMarks = allMarks.filter((m) => !m.pinned);
  $: pinnedMarks = allMarks.filter((m) => m.pinned);

  /**
   * A finding as a mark, in page coordinates, or in viewport coordinates
   * when its element sits in a fixed box.
   * @param {import("../audit.js").Finding} finding
   * @param {{ sx: number; sy: number; fixedBox: (el: Element) => Element | null }} context
   * @returns {LayoutInspectorMark}
   */
  function mark({ check, el, rect, message }, context) {
    const pinned = context.fixedBox(el) !== null;
    const x = Math.round((rect.left + (pinned ? 0 : context.sx)) * 10) / 10;
    const y = Math.round((rect.top + (pinned ? 0 : context.sy)) * 10) / 10;
    const width = Math.round(rect.width * 10) / 10;
    const height = Math.round(rect.height * 10) / 10;
    return {
      key: `${check}|${pinned}|${x}|${y}|${width}|${height}|${message}`,
      check,
      x,
      y,
      width,
      height,
      text: message,
      label: message,
      pinned,
    };
  }

  /**
   * Makes keys unique for the keyed `each`: two elements can share a box
   * and a message.
   * @param {LayoutInspectorMark[]} marks
   */
  function uniqueKeys(marks) {
    /** @type {Map<string, number>} */
    const seen = new Map();
    for (const m of marks) {
      const count = seen.get(m.key) ?? 0;
      seen.set(m.key, count + 1);
      if (count) m.key = `${m.key}|${count}`;
    }
    return marks;
  }

  /**
   * @param {LayoutInspectorMark[]} a
   * @param {LayoutInspectorMark[]} b
   */
  function sameMarks(a, b) {
    return a.length === b.length && a.every((m, i) => m.key === b[i].key);
  }

  /**
   * @typedef {{ spacing: boolean; contrast: boolean; targets: boolean; overflow: boolean; carbon: boolean; ignore: string; targetSize: number }} ScanOptions
   */

  /**
   * Runs the checks that are on near the viewport and stores the marks in
   * page coordinates. Checks again when the page changes or scrolls far;
   * scrolling only moves the layer. Marks that did not change keep their
   * DOM nodes.
   * @param {HTMLElement} node
   * @param {ScanOptions} options
   */
  function scanPage(node, options) {
    let current = options;

    /** @param {import("../page-scan.js").ScanBand} band */
    function scan(band) {
      readRemPx();
      const context = {
        sx: window.scrollX,
        sy: window.scrollY,
        fixedBox: createLayerLookup(["fixed"]),
      };
      const findings = runChecks({
        checks: AUDIT_CHECKS.filter((check) => current[check]),
        band,
        carbon: current.carbon,
        ignore: current.ignore,
        targetSize: current.targetSize,
        remPx,
        // A sticky box moves over the page too, so its targets do not
        // crowd the page's.
        layer: createLayerLookup(["fixed", "sticky"]),
      });
      /** @type {Record<LayoutInspectorCheck, LayoutInspectorMark[]>} */
      const next = { spacing: [], targets: [], contrast: [], overflow: [] };
      for (const finding of findings) {
        next[finding.check].push(mark(finding, context));
      }
      for (const check of AUDIT_CHECKS) uniqueKeys(next[check]);
      // Crowded labels share one, so a row of small targets stays legible.
      const all = [
        ...next.spacing,
        ...next.targets,
        ...next.contrast,
        ...next.overflow,
      ];
      const labels = mergeLabels(
        all.map((m) => ({ ...m, group: `${m.check}|${m.pinned}` })),
      );
      all.forEach((m, index) => {
        m.label = labels[index];
      });
      if (
        sameMarks(found.spacing, next.spacing) &&
        sameMarks(found.targets, next.targets) &&
        sameMarks(found.contrast, next.contrast) &&
        sameMarks(found.overflow, next.overflow)
      ) {
        return;
      }
      found = next;
    }

    const scroll = createFrameJob([
      () => [window.scrollX, window.scrollY],
      (/** @type {[number, number]} */ [x, y]) => {
        node.style.setProperty("--ccs-layout-inspector-x", `${-x}px`);
        node.style.setProperty("--ccs-layout-inspector-y", `${-y}px`);
      },
    ]);
    const page = observePage(scan, { onScroll: scroll.schedule });
    scroll.schedule();

    return {
      /** @param {ScanOptions} next */
      update(next) {
        current = next;
        page.schedule();
      },
      destroy() {
        page.destroy();
        scroll.cancel();
        found = { spacing: [], contrast: [], targets: [], overflow: [] };
      },
    };
  }

  $: checking = checkSpacing || checkContrast || checkTargets || checkOverflow;
</script>

{#if open}
  <!-- dir="ltr": measurements, hex values, and token names ("#161616",
       "16.4:1") must not reorder on an RTL page. Every position is in
       physical pixels, so nothing else depends on the direction. -->
  <div
    {...$$restProps}
    class:bx--layout-inspector={true}
    aria-hidden="true"
    dir="ltr"
    data-ccs-dev-tool
    use:trackPointer
  >
    {#if checking}
      <div
        class="bx--layout-inspector__page"
        use:scanPage={{
          spacing: checkSpacing,
          contrast: checkContrast,
          targets: checkTargets,
          overflow: checkOverflow,
          carbon: checkCarbon,
          ignore: checkIgnore,
          targetSize,
        }}
      >
        {#each pageMarks as pageMark (pageMark.key)}
          <div
            class="bx--layout-inspector__mark"
            class:bx--layout-inspector__mark--spacing={pageMark.check ===
              "spacing"}
            class:bx--layout-inspector__mark--target={pageMark.check ===
              "targets"}
            class:bx--layout-inspector__mark--contrast={pageMark.check ===
              "contrast"}
            class:bx--layout-inspector__mark--overflow={pageMark.check ===
              "overflow"}
            style:left="{pageMark.x}px"
            style:top="{pageMark.y}px"
            style:width="{pageMark.width}px"
            style:height="{pageMark.height}px"
          >
            {#if pageMark.label}
              <span class="bx--layout-inspector__mark-label"
                >{pageMark.label}</span
              >
            {/if}
          </div>
        {/each}
      </div>
      <div class="bx--layout-inspector__pinned">
        {#each pinnedMarks as pageMark (pageMark.key)}
          <div
            class="bx--layout-inspector__mark"
            class:bx--layout-inspector__mark--spacing={pageMark.check ===
              "spacing"}
            class:bx--layout-inspector__mark--target={pageMark.check ===
              "targets"}
            class:bx--layout-inspector__mark--contrast={pageMark.check ===
              "contrast"}
            class:bx--layout-inspector__mark--overflow={pageMark.check ===
              "overflow"}
            style:left="{pageMark.x}px"
            style:top="{pageMark.y}px"
            style:width="{pageMark.width}px"
            style:height="{pageMark.height}px"
          >
            {#if pageMark.label}
              <span class="bx--layout-inspector__mark-label"
                >{pageMark.label}</span
              >
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    {#if hover}
      {#if spacing}
        <div
          class="bx--layout-inspector__margin"
          style:left="{hover.marginBox.left}px"
          style:top="{hover.marginBox.top}px"
          style:width="{hover.marginBox.width}px"
          style:height="{hover.marginBox.height}px"
          style:border-width={hover.marginWidths.map((v) => `${v}px`).join(" ")}
        ></div>
        <div
          class="bx--layout-inspector__padding"
          style:left="{hover.paddingBox.left}px"
          style:top="{hover.paddingBox.top}px"
          style:width="{hover.paddingBox.width}px"
          style:height="{hover.paddingBox.height}px"
          style:border-width={hover.paddingWidths
            .map((v) => `${Math.max(0, v)}px`)
            .join(" ")}
        ></div>
        <div
          class="bx--layout-inspector__content"
          style:left="{hover.contentBox.left}px"
          style:top="{hover.contentBox.top}px"
          style:width="{hover.contentBox.width}px"
          style:height="{hover.contentBox.height}px"
        ></div>
        {#each hover.labels as label (label.kind + label.side)}
          <span
            class="bx--layout-inspector__side bx--layout-inspector__side--{label.kind}"
            class:bx--layout-inspector__side--off={label.off}
            style:left="{label.x}px"
            style:top="{label.y}px">{formatPx(label.value)}</span
          >
        {/each}
      {:else}
        <div
          class="bx--layout-inspector__outline"
          style:left="{hover.rect.left}px"
          style:top="{hover.rect.top}px"
          style:width="{hover.rect.width}px"
          style:height="{hover.rect.height}px"
        ></div>
      {/if}
      <div class="bx--layout-inspector__card" bind:this={cardRef}>
        <div class="bx--layout-inspector__card-header">
          <p class="bx--layout-inspector__card-title">{hover.info.name}</p>
          <p class="bx--layout-inspector__secondary">{hover.info.size}</p>
        </div>
        <dl class="bx--layout-inspector__list">
          {#if spacing}
            {#each [{ key: "margin", label: "Margin", values: hover.info.margin }, { key: "padding", label: "Padding", values: hover.info.padding, borders: hover.info.border }, ...(hover.info.gap ? [{ key: "gap", label: "Gap", values: [hover.info.gap.row, hover.info.gap.column] }] : [])] as group (group.key)}
              {@const lines = sideTokens(group.values, {
                borders: group.borders,
                carbon: hover.info.carbon,
                remPx,
              })}
              {#if lines.length}
                <div class="bx--layout-inspector__item">
                  <dt
                    class="bx--layout-inspector__term bx--layout-inspector__term--{group.key}"
                  >
                    {group.label}
                  </dt>
                  {#each lines as line (line.value + line.withBorder)}
                    <dd class="bx--layout-inspector__desc">
                      {line.value}px ·
                      {#if line.off}
                        <span class="bx--layout-inspector__off">off-scale</span>
                      {:else}
                        {line.token}
                      {/if}
                    </dd>
                    {#if line.withBorder}
                      <dd
                        class="bx--layout-inspector__desc bx--layout-inspector__secondary"
                      >
                        With its {line.withBorder}px border
                      </dd>
                    {/if}
                  {/each}
                </div>
              {/if}
            {/each}
          {/if}
          {#if hover.info.type}
            <div class="bx--layout-inspector__item">
              <dt class="bx--layout-inspector__term">Type</dt>
              <dd class="bx--layout-inspector__desc">
                {#if hover.info.type.length}
                  {hover.info.type.join(" / ")}
                {:else}
                  <span class="bx--layout-inspector__off">No token</span>
                {/if}
              </dd>
              <dd
                class="bx--layout-inspector__desc bx--layout-inspector__secondary"
              >
                {hover.info.typeSpec}
              </dd>
            </div>
          {/if}
          {#if hover.info.colors}
            {#each hover.info.colors.rows as row (row.key)}
              <div class="bx--layout-inspector__item">
                <dt class="bx--layout-inspector__term">{row.label}</dt>
                <dd class="bx--layout-inspector__desc">
                  {#if row.note}
                    {row.hex}
                  {:else}
                    <span
                      class="bx--layout-inspector__swatch"
                      style:background={row.swatch}
                    ></span>
                    {row.hex}
                  {/if}
                </dd>
                {#if row.tokens.length || row.inherited || (hover.info.colors.tokens && !row.note)}
                  <dd
                    class="bx--layout-inspector__desc bx--layout-inspector__secondary"
                  >
                    {#if row.inherited}
                      Inherited ·
                    {/if}
                    {#if row.tokens.length}
                      {row.tokens.slice(0, 2).join(" / ")}{row.tokens.length > 2
                        ? ` +${row.tokens.length - 2}`
                        : ""}
                    {:else if hover.info.colors.tokens && !row.note}
                      <span class="bx--layout-inspector__off">Off-palette</span>
                    {/if}
                  </dd>
                {/if}
              </div>
            {/each}
            {#if hover.info.colors.contrast}
              {@const c = hover.info.colors.contrast}
              <div class="bx--layout-inspector__item">
                <dt class="bx--layout-inspector__term">Contrast</dt>
                {#if c.approximate}
                  <dd class="bx--layout-inspector__desc">
                    Unknown over a background image
                  </dd>
                {:else}
                  <dd
                    class="bx--layout-inspector__desc bx--layout-inspector__verdict"
                    class:bx--layout-inspector__off={c.ratio < c.aa}
                  >
                    {formatRatio(c.ratio)}
                    ·
                    {c.ratio >= c.aaa
                      ? "AAA"
                      : c.ratio >= c.aa
                        ? "AA"
                        : "Fails AA"}
                  </dd>
                  {#if c.ratio < c.aa}
                    <dd
                      class="bx--layout-inspector__desc bx--layout-inspector__secondary"
                    >
                      Needs {c.aa}:1{c.large ? " for large text" : ""}
                    </dd>
                  {/if}
                {/if}
              </div>
            {/if}
          {/if}
        </dl>
        {#if measure}
          <p class="bx--layout-inspector__hint bx--layout-inspector__secondary">
            Hold {KEY_LABELS[measureKey]} to measure
          </p>
        {/if}
      </div>
    {/if}

    {#if distance}
      <div
        class="bx--layout-inspector__outline bx--layout-inspector__outline--anchor"
        style:left="{distance.a.left}px"
        style:top="{distance.a.top}px"
        style:width="{distance.a.width}px"
        style:height="{distance.a.height}px"
      ></div>
      <div
        class="bx--layout-inspector__outline"
        style:left="{distance.b.left}px"
        style:top="{distance.b.top}px"
        style:width="{distance.b.width}px"
        style:height="{distance.b.height}px"
      ></div>
      {#each distance.segments as segment, i (i)}
        <div
          class="bx--layout-inspector__segment"
          class:bx--layout-inspector__segment--vertical={segment.x1 ===
            segment.x2}
          style:left="{Math.min(segment.x1, segment.x2)}px"
          style:top="{Math.min(segment.y1, segment.y2)}px"
          style:width="{Math.abs(segment.x2 - segment.x1)}px"
          style:height="{Math.abs(segment.y2 - segment.y1)}px"
        >
          <span
            class="bx--layout-inspector__segment-label"
            class:bx--layout-inspector__side--off={segment.token === null}
          >
            {formatPx(segment.value)}{segment.token && segment.token !== "0"
              ? ` · ${segment.token}`
              : ""}
          </span>
        </div>
      {/each}
    {/if}

    {#if checking}
      <div class="bx--layout-inspector__summary">
        {#if checkSpacing}
          <span>{found.spacing.length} off-scale</span>
        {/if}
        {#if checkTargets}
          <span>{found.targets.length} small targets</span>
        {/if}
        {#if checkContrast}
          <span>{found.contrast.length} low contrast</span>
        {/if}
        {#if checkOverflow}
          <span>{found.overflow.length} overflowing</span>
        {/if}
      </div>
    {/if}
  </div>
{/if}
