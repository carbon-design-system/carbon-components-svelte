<script>
  /**
   * @template {keyof HTMLElementTagNameMap} [Tag="div"]
   * @slot {{}}
   */

  /**
   * Specify the minimum width of a column. The number of columns follows the
   * width of the container: as many as fit at this width, each stretched to
   * share the space. Any CSS length works.
   */
  export let columnWidth = "16rem";

  /**
   * Set a fixed number of columns, instead of fitting columns to
   * `columnWidth`.
   * @type {undefined | number}
   */
  export let columns = undefined;

  /**
   * Specify the space between items, in both directions.
   * The scale maps to the same Carbon layout values as `Stack`.
   * Use 0 for no gap. Alternatively, specify a custom length such as
   * `"1.5rem"`. Custom values *must* be a string.
   * @type {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | string}
   */
  export let gap = 5;

  /**
   * Set to `false` to always place the items with script, even where the
   * browser can pack them with `display: grid-lanes`.
   */
  export let native = true;

  /**
   * Set to `true` to keep the items hidden until the script has placed
   * them, instead of showing the server's rows first. Without script
   * support, or where the browser packs the items itself, the items are
   * shown from the start.
   */
  export let hideUntilPlaced = false;

  /**
   * Specify the tag name.
   * @type {Tag}
   */
  export let tag = /** @type {Tag} */ ("div");

  /**
   * Obtain a reference to the HTML element.
   * @type {null | HTMLElementTagNameMap[Tag]}
   * @bindable readonly
   */
  export let ref = null;

  import { afterUpdate, onMount } from "svelte";
  import { countTracks, placeMasonry } from "../utils/masonry.js";
  import { observeResize } from "../utils/shared-observer.js";

  /** Block size of the container, once the script has placed the items. */
  let height = 0;
  let placed = false;
  let mounted = false;

  /** @type {null | { root: HTMLElement; native: boolean; stop: () => void }} */
  let engine = null;

  $: fixed = typeof columns === "number" && columns >= 1;

  $: scaled = typeof gap === "number" && gap > 0;

  $: style =
    [
      $$restProps.style,
      !fixed &&
        columnWidth !== "16rem" &&
        `--ccs-masonry-column-width: ${columnWidth}`,
      fixed && `--ccs-masonry-columns: ${Math.floor(columns ?? 1)}`,
      typeof gap === "string" && `--ccs-masonry-gap: ${gap}`,
      placed && `--ccs-masonry-height: ${height}px`,
    ]
      .filter(Boolean)
      .join("; ") || undefined;

  $: props = {
    ...$$restProps,
    style,
    class: [
      $$restProps.class,
      "bx--masonry",
      fixed && "bx--masonry--columns",
      scaled && `bx--masonry--gap-${gap}`,
      gap === 0 && "bx--masonry--gap-0",
      !native && "bx--masonry--js",
      hideUntilPlaced && "bx--masonry--hide-until-placed",
      placed && "bx--masonry--placed",
    ]
      .filter(Boolean)
      .join(" "),
  };

  /**
   * Place the items in the shortest column, in source order, by script.
   * The container is a grid whose template picks the column count; each
   * item is moved into its grid column and down to its offset, so the items
   * keep their place in the DOM and in the tab order.
   * @param {HTMLElement} root
   */
  function start(root) {
    /** @type {WeakMap<Element, number>} */
    const sizes = new WeakMap();
    /** @type {WeakMap<HTMLElement, [string, string]>} */
    const applied = new WeakMap();
    /** @type {Map<HTMLElement, () => void>} */
    const observed = new Map();
    let frame = 0;

    /**
     * @param {HTMLElement} item
     * @param {string} column
     * @param {string} top
     */
    function apply(item, column, top) {
      applied.set(item, [column, top]);
      if (item.style.getPropertyValue("--ccs-masonry-column") !== column)
        item.style.setProperty("--ccs-masonry-column", column);
      if (item.style.getPropertyValue("--ccs-masonry-top") !== top)
        item.style.setProperty("--ccs-masonry-top", top);
    }

    function flush() {
      frame = 0;
      const all = /** @type {HTMLElement[]} */ (
        Array.from(root.children).filter((el) => el instanceof HTMLElement)
      );
      for (const item of all) {
        if (!observed.has(item)) {
          observed.set(item, observeResize(item, onItemResize));
          mutations.observe(item, {
            attributes: true,
            attributeFilter: ["style"],
          });
        }
      }
      for (const [item, stop] of observed) {
        if (item.parentNode !== root) {
          observed.delete(item);
          stop();
        }
      }

      const computed = getComputedStyle(root);
      const count = countTracks(computed.gridTemplateColumns);
      const space = Number.parseFloat(computed.rowGap) || 0;

      /** @type {HTMLElement[]} */
      const placeable = [];
      /** @type {number[]} */
      const heights = [];
      for (const item of all) {
        let h = sizes.get(item);
        if (h === undefined) {
          h = item.getBoundingClientRect().height;
          sizes.set(item, h);
        }
        // An item with no box (`display: none`) takes no place.
        if (h > 0) {
          placeable.push(item);
          heights.push(h);
        }
      }

      const next = placeMasonry(heights, count, space);
      placeable.forEach((item, i) => {
        apply(item, String(next.column[i] + 1), `${next.top[i]}px`);
      });
      height = next.height;
      placed = true;
      // What the observer saw is this function's own writes.
      mutations.takeRecords();
    }

    // A size change is handled in the next frame: changing the container's
    // height inside the callback would report a loop in the observer.
    function request() {
      if (!frame) frame = requestAnimationFrame(flush);
    }

    /** @param {ResizeObserverEntry} entry */
    function onItemResize(entry) {
      sizes.set(
        entry.target,
        entry.borderBoxSize?.[0]?.blockSize ??
          entry.target.getBoundingClientRect().height,
      );
      request();
    }

    // The width of the container sets the column count and the item widths.
    const stopRoot = observeResize(root, request);

    // Items added or removed are placed at once, before the browser paints.
    // An item whose `style` attribute is set again has lost its place: Svelte
    // replaces the whole attribute, so put the place back.
    const mutations = new MutationObserver((records) => {
      let changed = false;
      for (const record of records) {
        if (record.type === "childList") {
          changed = true;
        } else if (record.target instanceof HTMLElement) {
          const place = applied.get(record.target);
          if (place) apply(record.target, place[0], place[1]);
        }
      }
      if (changed) {
        if (frame) cancelAnimationFrame(frame);
        flush();
      } else {
        mutations.takeRecords();
      }
    });
    mutations.observe(root, { childList: true });

    flush();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      stopRoot();
      for (const stop of observed.values()) stop();
      mutations.disconnect();
      placed = false;
    };
  }

  /**
   * Run the script placement unless the browser packs the items itself.
   * The computed `display` says which one the styles chose.
   */
  function sync() {
    const root = ref;
    if (engine && engine.root === root && engine.native === native) return;
    engine?.stop();
    engine = null;
    if (!root) return;
    if (getComputedStyle(root).display === "grid-lanes") return;
    engine = { root, native, stop: start(root) };
  }

  onMount(() => {
    mounted = true;
    sync();
    return () => {
      engine?.stop();
      engine = null;
    };
  });

  afterUpdate(() => {
    if (mounted) sync();
  });
</script>

<svelte:element this={tag} bind:this={ref} {...props}>
  <slot />
</svelte:element>
