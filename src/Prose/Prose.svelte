<script>
  /**
   * @restProps {any}
   * @slot {{}}
   */

  /**
   * Set the type scale and spacing for the copy inside.
   * - `"default"`: 16px body copy and productive headings, for reading pages
   * - `"condensed"`: 14px body copy with a shorter line height and tighter
   *   spacing than compact, for side panels and inspectors
   * - `"compact"`: 14px body copy and tighter spacing, for dense product UI
   * - `"spacious"`: 16px body copy with larger headings and more room
   * - `"expressive"`: expressive headings that scale with the viewport and
   *   wider spacing, for editorial and marketing pages
   * @type {"condensed" | "compact" | "default" | "spacious" | "expressive"}
   */
  export let variant = "default";

  /**
   * Set the link color.
   * - `"default"`: links and heading anchors in the link color
   * - `"muted"`: links in the text color, underlined, and heading anchors in
   *   the secondary text color; both take the link color on hover. For copy
   *   dense with links, such as reference docs.
   *
   * Links have no visited color, like `Link` by default.
   * @type {"default" | "muted"}
   */
  export let linkTone = "default";

  /**
   * Set how tables size. Either way, the first and last columns line up
   * with the copy.
   * - `"fit"`: columns at their content width with a gap between them, so
   *   a short table reads with the copy around it
   * - `"full"`: the table spans the line length with padded cells, for wide
   *   or data-heavy tables
   * @type {"fit" | "full"}
   */
  export let tableWidth = "fit";

  /**
   * Set how `kbd` keys look. Either way, keys never change line spacing.
   * - `"keycap"`: a flat key with a heavier bottom edge
   * - `"muted"`: no box, semibold text in the secondary color, the way
   *   `Menu` shows shortcuts; for dense copy and long key sequences
   * @type {"keycap" | "muted"}
   */
  export let kbd = "keycap";

  /**
   * Set to `true` to draw a rule above each `h2` but a first one, to set
   * sections apart
   */
  export let dividers = false;

  /**
   * Override the max width. Each variant caps the line length: 80 characters
   * (condensed and compact), 68 (default), 64 (spacious), or 60
   * (expressive). Numbers are treated as pixels; strings accept any CSS
   * length, or `"none"` to fill the container.
   * @type {number | string | undefined}
   */
  export let maxWidth = undefined;

  /**
   * Set to `true` to skip rendering code blocks (`pre`) and figures while
   * they are offscreen, with `content-visibility: auto`. They stay in find
   * in page, anchor navigation, and the accessibility tree. A code block
   * reserves the height of its lines until it first renders, then its last
   * rendered height; a figure, and a code block in server-rendered HTML
   * before the script runs, reserves 10rem.
   */
  export let deferOffscreen = false;

  /**
   * Specify the tag name.
   * @type {keyof HTMLElementTagNameMap}
   */
  export let tag = "div";

  /**
   * Obtain a reference to the HTML element.
   * @type {null | HTMLElement}
   * @bindable readonly
   */
  export let ref = null;

  import { onMount } from "svelte";
  import { toCssLength } from "../utils/css-length.js";
  import { noop } from "../utils/noop.js";

  const TRAILING_NEWLINE_RE = /\n$/;

  /**
   * Whether this browser adds a skipped block's padding and border to the
   * height it reserves, as the spec has it. Firefox doesn't, so there the
   * reservation includes them. Found from the first skipped block.
   * @type {boolean | undefined}
   */
  let reserveAddsPadding;

  /**
   * Gives each code block the height of its lines to reserve while it's
   * skipped. With one guess for every block, a block above the reader
   * changed height as it first rendered, and moved the page in Safari,
   * which doesn't anchor the scroll. In `em`, it follows the block's font
   * size. Lines don't wrap in a code block; it scrolls instead.
   * @param {HTMLElement} root
   */
  function reserveCodeHeights(root) {
    /** @type {{ pre: HTMLElement, content: number, extra: number, fontSize: number }[]} */
    const blocks = [];
    for (const pre of root.querySelectorAll("pre")) {
      const style = getComputedStyle(pre);
      // Only the blocks Prose styles are skipped, not a component's.
      if (style.contentVisibility && style.contentVisibility !== "auto") {
        continue;
      }
      const lineHeight = Number.parseFloat(style.lineHeight);
      const fontSize = Number.parseFloat(style.fontSize);
      if (!lineHeight || !fontSize) continue;
      // A trailing newline renders no line.
      const lines = (pre.textContent ?? "")
        .replace(TRAILING_NEWLINE_RE, "")
        .split("\n").length;
      const extra = [
        style.paddingTop,
        style.paddingBottom,
        style.borderTopWidth,
        style.borderBottomWidth,
      ].reduce((sum, value) => sum + (Number.parseFloat(value) || 0), 0);
      blocks.push({ pre, content: lines * lineHeight, extra, fontSize });
    }
    const reserve = () => {
      for (const { pre, content, extra, fontSize } of blocks) {
        const px = reserveAddsPadding === false ? content + extra : content;
        const height = `${Math.round((px * 1000) / fontSize) / 1000}em`;
        if (pre.style.getPropertyValue("--ccs-prose-defer-height") !== height) {
          pre.style.setProperty("--ccs-prose-defer-height", height);
        }
      }
    };
    reserve();
    if (reserveAddsPadding !== undefined) return;
    const skipped = blocks.find(
      ({ pre }) =>
        pre.firstElementChild?.checkVisibility?.({
          contentVisibilityAuto: true,
        }) === false,
    );
    if (!skipped) return;
    const height = skipped.pre.getBoundingClientRect().height;
    reserveAddsPadding =
      Math.abs(height - skipped.content - skipped.extra) <
      Math.abs(height - skipped.content);
    if (!reserveAddsPadding) reserve();
  }

  /**
   * Code blocks Prose gave a tab stop, so it only removes its own.
   * @type {WeakSet<HTMLElement>}
   */
  const tabStops = new WeakSet();

  /**
   * A code block that scrolls sideways gets a tab stop, so a keyboard can
   * scroll it. Chrome and Firefox focus a scroller on their own; Safari
   * doesn't. A block that fits gets none, so it adds no stop.
   * @param {HTMLElement} pre
   */
  function syncTabStop(pre) {
    // A skipped block has no lines to measure. Firefox measures one anyway,
    // and a tab stop there changed the size it reserves for other blocks.
    const skipped =
      pre.firstElementChild?.checkVisibility?.({
        contentVisibilityAuto: true,
      }) === false;
    if (skipped) return;
    const overflows = pre.scrollWidth > pre.clientWidth;
    if (overflows && !pre.hasAttribute("tabindex")) {
      pre.tabIndex = 0;
      tabStops.add(pre);
    } else if (!overflows && tabStops.has(pre)) {
      pre.removeAttribute("tabindex");
      tabStops.delete(pre);
    }
  }

  /**
   * The code blocks Prose styles: not a component's, and not a nested
   * Prose's, which handles its own.
   * @param {HTMLElement} root
   */
  function ownCodeBlocks(root) {
    return [...root.querySelectorAll("pre")].filter(
      (pre) => pre.closest('[class*="bx--"]') === root,
    );
  }

  /**
   * Watches each code block's width and lines. Its `code` is watched too:
   * a skipped block keeps its size when it first renders, but its lines
   * don't.
   * @param {HTMLElement} root
   */
  function startTabStops(root) {
    if (typeof ResizeObserver === "undefined") return noop;
    const observer = new ResizeObserver((entries) => {
      for (const { target } of entries) {
        const pre = target.closest("pre");
        if (pre) syncTabStop(pre);
      }
    });
    const observe = () => {
      observer.disconnect();
      for (const pre of ownCodeBlocks(root)) {
        observer.observe(pre);
        if (pre.firstElementChild) observer.observe(pre.firstElementChild);
      }
    };
    observe();
    return () => observer.disconnect();
  }

  let stop = noop;

  /**
   * @param {HTMLElement} root
   * @param {boolean} defer
   */
  function start(root, defer) {
    if (defer) reserveCodeHeights(root);
    let stopTabStops = startTabStops(root);
    if (typeof MutationObserver === "undefined") return stopTabStops;
    // The slot's content can change after mount, from a parent or `{@html}`.
    const observer = new MutationObserver(() => {
      if (defer) reserveCodeHeights(root);
      stopTabStops();
      stopTabStops = startTabStops(root);
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => {
      observer.disconnect();
      stopTabStops();
    };
  }

  let mounted = false;
  onMount(() => {
    mounted = true;
    return () => stop();
  });

  $: if (mounted) {
    stop();
    stop = ref ? start(ref, deferOffscreen) : noop;
  }

  $: proseClass = [
    "bx--prose",
    variant === "condensed" && "bx--prose--condensed",
    variant === "compact" && "bx--prose--compact",
    variant === "spacious" && "bx--prose--spacious",
    variant === "expressive" && "bx--prose--expressive",
    linkTone === "muted" && "bx--prose--link-muted",
    dividers && "bx--prose--dividers",
    tableWidth === "full" && "bx--prose--table-full",
    kbd === "muted" && "bx--prose--kbd-muted",
    deferOffscreen && "bx--prose--defer-offscreen",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

<svelte:element
  this={tag}
  bind:this={ref}
  {...$$restProps}
  class={proseClass}
  style:max-width={toCssLength(maxWidth)}
>
  <slot />
</svelte:element>
