<script context="module">
  let manualCount = 0;
  /** @type {ScrollRestoration | undefined} */
  let manualBefore;

  // `history.scrollRestoration` belongs to the current history entry, and
  // the entries a page pushes inherit it, so it is put back when the last
  // list leaves. Two lists share one hold.
  function holdScrollRestoration() {
    if (typeof history === "undefined" || !("scrollRestoration" in history)) {
      return () => {};
    }
    manualCount += 1;
    if (manualCount === 1) {
      manualBefore = history.scrollRestoration;
      history.scrollRestoration = "manual";
    }
    return () => {
      manualCount -= 1;
      if (manualCount === 0 && manualBefore) {
        history.scrollRestoration = manualBefore;
      }
    };
  }
</script>

<script>
  /**
   * @template [Item=any]
   */

  /**
   * @template [Item=any]
   * @typedef {object} InfiniteListPage
   * @property {ReadonlyArray<Item>} items
   * @property {any} [nextCursor] - Passed to `load` for the next page. `null` or `undefined` ends the list.
   * @property {number} [total] - How many items match in all, if the source knows.
   */

  /**
   * @typedef {object} InfiniteListRequest
   * @property {any} cursor - `undefined` for the first page.
   * @property {AbortSignal} signal - Aborted when the list is reset or removed.
   */

  /**
   * @restProps {ul | div}
   * @slot {{ item: Item; index: number; }}
   * @slot {{}} empty
   * @slot {{}} loading
   * @slot {{ error: unknown; retry: () => void; }} error
   * @slot {{ count: number; total: number | undefined; }} end
   * @slot {{ count: number; total: number | undefined; }} cap
   */

  /**
   * Dispatched after a page is added.
   * @event {{ items: ReadonlyArray<Item>; count: number; page: number; }} loaded
   */

  /**
   * Dispatched when a page fails. The list keeps what it has.
   * @event {{ error: unknown; }} error
   */

  /**
   * Specify how to fetch a page. Called with the cursor the last page
   * returned (`undefined` for the first), and a `signal` to pass to `fetch`.
   * @type {((request: InfiniteListRequest) => Promise<InfiniteListPage<Item>> | InfiniteListPage<Item>) | undefined}
   */
  export let load = undefined;

  /**
   * Specify the first page, such as one the server rendered. Without it, the
   * list calls `load` once when it mounts.
   * @type {InfiniteListPage<Item> | undefined}
   */
  export let initial = undefined;

  /**
   * Specify the unique, stable key of an item. A page that repeats an item
   * the list already holds, because the data shifted, adds nothing.
   * Defaults to `item.id`, then the index.
   * @type {(item: Item, index: number) => string | number}
   */
  export let getKey = defaultGetKey;

  /**
   * Specify how the next page loads. `"button"` waits for a click.
   * `"auto"` loads it as the reader nears the end, and keeps the button
   * as the keyboard path. `"auto-then-button"` loads `autoPages` pages that
   * way, then waits for a click, so a reader can reach the footer.
   * @type {"button" | "auto" | "auto-then-button"}
   */
  export let mode = "button";

  /**
   * Specify how many pages load by themselves, after the first, when
   * `mode` is `"auto-then-button"`.
   */
  export let autoPages = 2;

  /**
   * Specify how far from the end of the scroll area counts as near, as a
   * CSS margin. The next page loads before the reader gets there.
   */
  export let rootMargin = "400px";

  /**
   * Specify the most items to load. At the cap the list stops, and the `cap`
   * slot says to refine the search. A page that crosses it is kept whole.
   * @type {number | undefined}
   */
  export let maxItems = undefined;

  /**
   * Specify how many items match in all. Defaults to the `total` of the
   * pages. With no total, `aria-setsize` is `-1` while more can load.
   * @type {number | undefined}
   */
  export let total = undefined;

  /**
   * Set `"feed"` for a stream of articles (a timeline, posts, activity).
   * The list gets `role="feed"`, each item `role="article"`, and Page Down
   * and Page Up move between articles. The default is a plain list.
   * @type {"list" | "feed"}
   */
  export let pattern = "list";

  /**
   * Specify what scrolls. `"window"` scrolls the page. `"container"` makes
   * the list its own scroll area, `height` tall.
   * @type {"window" | "container"}
   */
  export let scroll = "window";

  /**
   * Specify the height of the scroll area, as a CSS length, when `scroll` is
   * `"container"`.
   * @type {string | undefined}
   */
  export let height = undefined;

  /**
   * Set to `true` to keep the reader's place. The loaded pages and the first
   * item in view are saved as the reader scrolls, and brought back on Back,
   * Forward and reload. Set a string to name the list when more than one
   * list shares a URL. While it is on, the list sets
   * `history.scrollRestoration` to `"manual"`.
   * @type {boolean | string}
   */
  export let restore = false;

  /**
   * Set to `true` to let the browser skip the layout and paint of items
   * that are off screen (`content-visibility: auto`). A deep list then
   * costs about as much to lay out as one page. An item is clipped to its
   * own box, so a focus ring, shadow or menu that spills out of it is cut
   * off. Set `--ccs-infinite-list-item-size` to a typical item height, so
   * the scrollbar and the restored place are close before an item is drawn.
   */
  export let lazyItems = false;

  /**
   * Set to `false` to hide the link before the list that skips past it.
   */
  export let skipLink = true;

  /**
   * Specify the locale to format numbers in.
   */
  export let locale = "en-US";

  /** Specify the label of the button. */
  export let loadMoreText = "Load more";

  /** Specify the label of the button while a page loads. */
  export let loadingMoreText = "Loading more";

  /** Specify the label of the button that tries a failed page again. */
  export let retryText = "Try again";

  /** Specify the message when a page fails. */
  export let errorText = "Could not load results.";

  /** Specify the message for a list with no items. */
  export let emptyText = "No results";

  /** Specify the message under the last item. */
  export let endText = "You have reached the end of the results.";

  /** Specify the text of the link that skips past the list. */
  export let skipLinkText = "Skip to end of results";

  /** Specify the message while the first page loads. */
  export let loadingText = "Loading results";

  /**
   * Specify the line above the button.
   * @type {(shown: number, total: number) => string}
   */
  export let countText = defaultCountText;

  /**
   * Specify the message a screen reader hears when a page loads.
   * @type {(count: number) => string}
   */
  export let loadedText = defaultLoadedText;

  /**
   * Specify the message at the depth cap.
   * @type {(shown: number, total: number | undefined) => string}
   */
  export let capText = defaultCapText;

  /**
   * Specify an `id` for the list. The link that skips it derives its target
   * from it.
   * @type {string | undefined}
   */
  export let id = undefined;

  /**
   * The items loaded so far.
   * @type {ReadonlyArray<Item>}
   * @bindable readonly
   */
  export let items = [];

  /**
   * Fetch the next page, as the button does.
   * @returns {Promise<void>}
   */
  export function loadMore() {
    return loadNext(false);
  }

  /**
   * Drop the loaded items and start over from the first page, such as after
   * the search changed. Pass the new first page, or leave it out to `load` it.
   * @param {InfiniteListPage<Item>} [page]
   * @returns {Promise<void>}
   */
  export async function reset(page) {
    stopWork();
    byKey.clear();
    keys = [];
    items = [];
    cursors = [];
    nextCursor = undefined;
    hasMore = false;
    pageTotal = undefined;
    failed = false;
    failure = undefined;
    ready = false;
    if (storageKey && storage) storage.removeItem(storageKey);
    if (page) {
      applyPage(page, undefined);
      ready = true;
      await tick();
      watch();
    } else {
      await loadNext(false);
    }
  }

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import InlineLoading from "../InlineLoading/InlineLoading.svelte";
  import { debounce } from "../utils/debounce.js";
  import {
    appendNewItems,
    captureAnchor,
    currentEntryKey,
    defaultGetKey,
    focusItem,
    loadPagesTogether,
    loadsOnScroll,
    observeEnd,
    parseSnapshot,
    reachedCap,
    scrollDeltaForAnchor,
    setSize,
    snapshotStorageKey,
  } from "../utils/infinite-list.js";
  import { getNumberFormatter } from "../utils/intl-formatter-cache.js";
  import { noop } from "../utils/noop.js";
  import { safeBrowserStorage } from "../utils/storage.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { addPooledListener } from "../utils/window-listener-pool.js";

  const dispatch = createEventDispatcher();

  /** @param {number} value */
  function formatNumber(value) {
    return getNumberFormatter(locale).format(value);
  }

  /**
   * @param {number} shown
   * @param {number} outOf
   */
  function defaultCountText(shown, outOf) {
    return `Showing ${formatNumber(shown)} of ${formatNumber(outOf)}`;
  }

  /** @param {number} count */
  function defaultLoadedText(count) {
    return count === 1
      ? "1 more result loaded"
      : `${formatNumber(count)} more results loaded`;
  }

  /**
   * @param {number} shown
   * @param {number | undefined} outOf
   */
  function defaultCapText(shown, outOf) {
    return outOf === undefined
      ? `Showing ${formatNumber(shown)} results. Refine your search to see more.`
      : `Showing ${formatNumber(shown)} of ${formatNumber(outOf)}. Refine your search to see more.`;
  }

  const fallbackId = uniqueId();

  /** @type {Map<string | number, Item>} */
  const byKey = new Map();

  // The rows iterate keys, and look their item up in a Map nothing reassigns.
  // Appending a page then only creates its own rows: in Svelte 5's legacy
  // mode a keyed `{#each}` over the item objects re-runs every row's slot
  // whenever the array is reassigned.
  /** @type {Array<string | number>} */
  let keys = [];
  /** @type {unknown[]} */
  let cursors = [];
  /** @type {unknown} */
  let nextCursor;
  let hasMore = false;
  /** @type {number | undefined} */
  let pageTotal;
  /** @type {"idle" | "first" | "more" | "restoring"} */
  let phase = "idle";
  let failed = false;
  /** @type {unknown} */
  let failure;
  // `true` once a page arrived or failed, so "No results" is not shown for a
  // list that has not asked yet.
  let ready = false;
  // `false` while a restored place is being held in position.
  let settled = true;
  let mounted = false;
  let message = "";
  let messageStamp = 0;

  /** @type {null | HTMLDivElement} */
  let rootEl = null;
  /** @type {null | HTMLElement} */
  let listEl = null;
  /** @type {null | HTMLDivElement} */
  let footerEl = null;
  /** @type {null | HTMLDivElement} */
  let afterEl = null;
  /** @type {null | HTMLButtonElement} */
  let buttonEl = null;

  let epoch = 0;
  /** @type {AbortController | null} */
  let controller = null;
  let nearEnd = false;
  let stopWatching = noop;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let messageTimer;

  /** @type {string | null} */
  let storageKey = null;
  /** @type {ReturnType<typeof safeBrowserStorage> | null} */
  let storage = null;
  let stopRestoring = noop;

  $: baseId = id || fallbackId;
  $: capped = reachedCap(keys.length, maxItems);
  $: loadable = hasMore && !capped;
  $: knownTotal = total ?? pageTotal;
  $: itemSetSize = setSize({
    count: keys.length,
    total: knownTotal,
    hasMore,
  });
  $: busy = phase !== "idle";
  $: scrollRoot = scroll === "container" ? rootEl : null;
  $: feed = pattern === "feed";
  $: listTag = feed ? "div" : "ul";
  $: itemTag = feed ? "div" : "li";
  $: showCount =
    loadable && knownTotal !== undefined && knownTotal > keys.length && !failed;

  $: if (mounted && footerEl) watch(scrollRoot, rootMargin);

  /** @param {string | number} key */
  function itemFor(key) {
    return /** @type {Item} */ (byKey.get(key));
  }

  /**
   * @param {InfiniteListPage<Item>} page
   * @param {unknown} cursor
   * @returns {number} How many items it added.
   */
  function applyPage(page, cursor) {
    const added = appendNewItems(byKey, page.items, getKey, keys.length);
    if (added.length > 0) {
      keys = keys.concat(added);
      items = keys.map((key) => /** @type {Item} */ (byKey.get(key)));
    }
    cursors = [...cursors, cursor ?? null];
    nextCursor = page.nextCursor;
    hasMore = page.nextCursor !== undefined && page.nextCursor !== null;
    if (typeof page.total === "number") pageTotal = page.total;
    return added.length;
  }

  if (initial) {
    applyPage(initial, undefined);
    ready = true;
  }

  function stopWork() {
    epoch++;
    controller?.abort();
    controller = null;
    phase = "idle";
  }

  /** @param {string} text */
  function announce(text) {
    message = text;
    messageStamp += 1;
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => {
      message = "";
    }, 7000);
  }

  /**
   * @param {boolean} byClick Whether a reader asked for the page. If so,
   *   focus moves to its first item.
   * @returns {Promise<void>}
   */
  async function loadNext(byClick) {
    if (!load || phase !== "idle" || (keys.length > 0 && !loadable)) return;
    const token = ++epoch;
    const before = keys.length;
    const cursor = before > 0 ? nextCursor : undefined;
    failed = false;
    failure = undefined;
    phase = before > 0 ? "more" : "first";
    controller = new AbortController();
    try {
      const page = await load({ cursor, signal: controller.signal });
      if (token !== epoch) return;
      const added = applyPage(page, cursor);
      ready = true;
      phase = "idle";
      if (added > 0 && before > 0) announce(loadedText(added));
      dispatch("loaded", {
        items: keys.slice(before).map((key) => byKey.get(key)),
        count: keys.length,
        page: cursors.length,
      });
      await tick();
      if (token !== epoch) return;
      if (byClick && added > 0) focusItem(listEl?.children[before]);
      saveSoon();
      watch();
    } catch (error) {
      if (token !== epoch) return;
      ready = true;
      phase = "idle";
      failed = true;
      failure = error;
      dispatch("error", { error });
    }
  }

  function retry() {
    loadNext(true);
  }

  function onLoadMoreClick() {
    loadNext(true);
  }

  function focusInside() {
    const active = rootEl?.ownerDocument.activeElement;
    return Boolean(active && rootEl?.contains(active));
  }

  // The reader's keyboard focus is in the list: they are tabbing through it.
  // A page that arrived under them would move the end they are heading for.
  // The button is the way on, and it stays where they can reach it.
  function loadWhenNear() {
    if (!nearEnd || failed || !loadable || phase !== "idle") return;
    if (
      !loadsOnScroll({ mode, autoPages, pageCount: cursors.length }) ||
      focusInside()
    ) {
      return;
    }
    loadNext(false);
  }

  /**
   * @param {Element | null} [root]
   * @param {string} [margin]
   */
  function watch(root = scrollRoot, margin = rootMargin) {
    stopWatching();
    stopWatching = noop;
    if (!footerEl) return;
    stopWatching = observeEnd(
      footerEl,
      { root: root ?? null, rootMargin: margin },
      (near) => {
        nearEnd = near;
        loadWhenNear();
      },
    );
  }

  /** @param {FocusEvent} event */
  function onFocusOut(event) {
    // Focus left the list: a reader who was tabbing is done, so the pause
    // ends. The watcher checks again.
    const to = event.relatedTarget;
    if (mode !== "button" && !(to instanceof Node && rootEl?.contains(to))) {
      watch();
    }
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    if (
      !feed ||
      !listEl ||
      (event.key !== "PageDown" && event.key !== "PageUp") ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }
    const current = /** @type {Element} */ (event.target)?.closest?.(
      '[role="article"]',
    );
    if (!current || current.parentElement !== listEl) return;
    const next =
      listEl.children[
        Array.prototype.indexOf.call(listEl.children, current) +
          (event.key === "PageDown" ? 1 : -1)
      ];
    event.preventDefault();
    if (next) {
      /** @type {HTMLElement} */ (next).focus();
    } else if (event.key === "PageDown") {
      if (loadable && load) loadNext(true);
      else buttonEl?.focus();
    }
  }

  /** @param {MouseEvent} event */
  function onSkip(event) {
    event.preventDefault();
    afterEl?.focus();
    afterEl?.scrollIntoView?.({ block: "nearest" });
  }

  function scrollTop() {
    return scrollRoot ? scrollRoot.scrollTop : window.scrollY;
  }

  function rootTop() {
    return scrollRoot ? scrollRoot.getBoundingClientRect().top : 0;
  }

  /** @param {number} delta */
  function scrollByDelta(delta) {
    if (scrollRoot) scrollRoot.scrollTop += delta;
    else window.scrollBy(0, delta);
  }

  function save() {
    if (!storageKey || !storage || !listEl || phase === "restoring") return;
    // A list that is detached or hidden measures as zero. Keep the last
    // snapshot rather than save that.
    if (!listEl.isConnected || !rootEl?.getClientRects().length) return;
    const anchor = captureAnchor(listEl.children, rootTop());
    storage.setItem(
      storageKey,
      JSON.stringify({
        v: 1,
        cursors,
        anchorKey: anchor ? keys[anchor.index] : null,
        offset: anchor ? anchor.offset : 0,
        y: scrollTop(),
      }),
    );
  }

  const saveSoon = debounce(save, 250);

  /** @param {import("../utils/infinite-list.js").InfiniteListSnapshot} snapshot */
  function settleOnAnchor(snapshot) {
    const index =
      snapshot.anchorKey === null ? -1 : keys.indexOf(snapshot.anchorKey);
    const element = index >= 0 ? listEl?.children[index] : undefined;
    if (!element) {
      const y = snapshot.y;
      if (scrollRoot) scrollRoot.scrollTop = y;
      else window.scrollTo(0, y);
      return 0;
    }
    const delta = scrollDeltaForAnchor(
      element.getBoundingClientRect().top,
      rootTop(),
      snapshot.offset,
    );
    if (Math.abs(delta) >= 1) scrollByDelta(delta);
    return Math.abs(delta);
  }

  /** @param {import("../utils/infinite-list.js").InfiniteListSnapshot} snapshot */
  async function restoreSnapshot(snapshot) {
    const token = ++epoch;
    settled = false;
    phase = "restoring";
    controller = new AbortController();
    const { signal } = controller;
    const request = (/** @type {unknown} */ cursor) =>
      Promise.resolve(load?.({ cursor, signal })).then(
        (page) => /** @type {InfiniteListPage<Item>} */ (page),
      );
    if (keys.length === 0) {
      try {
        applyPage(await request(undefined), undefined);
      } catch (error) {
        if (token === epoch) {
          phase = "idle";
          ready = true;
          failed = true;
          failure = error;
          dispatch("error", { error });
        }
        return;
      }
      if (token !== epoch) return;
    }
    // The cursors are known, so the pages load together.
    const wanted = snapshot.cursors.slice(cursors.length);
    if (wanted.length > 0 && hasMore) {
      const result = await loadPagesTogether(request, wanted);
      if (token !== epoch) return;
      wanted.forEach((cursor, i) => {
        if (result.pages[i]) applyPage(result.pages[i], cursor);
      });
      if (result.failed) {
        failed = true;
        failure = result.error;
        dispatch("error", { error: result.error });
      }
    }
    ready = true;
    phase = "idle";
    await tick();
    if (token !== epoch) return;
    // Rows above the anchor can still change height (images, fonts). Hold
    // the anchor in place until it has been still for a few frames, or the
    // reader takes over by scrolling.
    const target = scrollRoot ?? window;
    let frames = 0;
    let still = 0;
    let stop = noop;
    const finish = () => {
      stop();
      settled = true;
      watch();
    };
    const takeOver = () => finish();
    for (const type of ["wheel", "touchstart", "keydown", "pointerdown"]) {
      target.addEventListener(type, takeOver, { once: true, passive: true });
    }
    stop = () => {
      for (const type of ["wheel", "touchstart", "keydown", "pointerdown"]) {
        target.removeEventListener(type, takeOver);
      }
      stop = noop;
    };
    const correct = () => {
      if (token !== epoch || settled) return;
      frames += 1;
      still = settleOnAnchor(snapshot) < 1 ? still + 1 : 0;
      if (still >= 3 || frames >= 30) finish();
      else requestAnimationFrame(correct);
    };
    correct();
  }

  function startRestoring() {
    storage = safeBrowserStorage("sessionStorage");
    const name =
      restore === true
        ? window.location.pathname + window.location.search
        : restore;
    storageKey = snapshotStorageKey(name, currentEntryKey());
    const releaseScroll = holdScrollRestoration();
    const target = scrollRoot ?? window;
    const stops = [
      releaseScroll,
      addPooledListener("pagehide", save),
      () => {
        saveSoon.cancel();
        // The router may have removed the list already, which `save` skips.
        save();
      },
    ];
    target.addEventListener("scroll", saveSoon, { passive: true });
    stops.push(() => target.removeEventListener("scroll", saveSoon));
    // A click can follow a link to another page before the scroll settles.
    rootEl?.addEventListener("click", save, true);
    stops.push(() => rootEl?.removeEventListener("click", save, true));
    stopRestoring = () => {
      for (const stop of stops) stop();
    };
    const snapshot = parseSnapshot(storage.getItem(storageKey));
    if (snapshot && (snapshot.cursors.length > 1 || snapshot.y > 0) && load) {
      restoreSnapshot(snapshot);
    }
  }

  onMount(() => {
    mounted = true;
    if (restore) startRestoring();
    if (!ready && load && phase === "idle") loadNext(false);
    return () => {
      stopRestoring();
      stopWatching();
      stopWork();
      clearTimeout(messageTimer);
    };
  });
</script>

<!-- A scroll area takes focus so the keyboard can scroll it (Safari and older Firefox do not do it themselves). -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  bind:this={rootEl}
  class:bx--infinite-list={true}
  class:bx--infinite-list--container={scroll === "container"}
  class:bx--infinite-list--lazy={lazyItems}
  style:--ccs-infinite-list-height={scroll === "container" ? height : undefined}
  tabindex={scroll === "container" ? 0 : undefined}
  on:focusout={onFocusOut}
>
  {#if skipLink && keys.length > 0}
    <a
      class:bx--infinite-list__skip={true}
      href="#{baseId}-end"
      on:click={onSkip}
    >
      {skipLinkText}
    </a>
  {/if}
  {#if keys.length > 0}
    <svelte:element
      this={listTag}
      bind:this={listEl}
      class:bx--infinite-list__list={true}
      role={feed ? "feed" : undefined}
      aria-busy={busy ? "true" : undefined}
      on:keydown={onKeydown}
      {...$$restProps}
    >
      {#each keys as key, index (key)}
        {@const item = itemFor(key)}
        <svelte:element
          this={itemTag}
          class:bx--infinite-list__item={true}
          role={feed ? "article" : undefined}
          tabindex={feed ? -1 : undefined}
          aria-posinset={index + 1}
          aria-setsize={itemSetSize}
        >
          <slot {item} {index} />
        </svelte:element>
      {/each}
    </svelte:element>
  {:else if ready && !failed}
    <div class:bx--infinite-list__message={true}>
      <slot name="empty">{emptyText}</slot>
    </div>
  {:else if !ready}
    <div class:bx--infinite-list__message={true}>
      <slot name="loading">
        <InlineLoading description={loadingText} />
      </slot>
    </div>
  {/if}
  <div bind:this={footerEl} class:bx--infinite-list__footer={true}>
    {#if failed}
      <div class:bx--infinite-list__error={true} role="alert">
        <slot name="error" error={failure} {retry}>
          <span class:bx--infinite-list__error-text={true}>{errorText}</span>
          <Button kind="tertiary" size="sm" on:click={retry}>
            {retryText}
          </Button>
        </slot>
      </div>
    {:else if capped}
      <div class:bx--infinite-list__note={true}>
        <slot name="cap" count={keys.length} total={knownTotal}>
          {capText(keys.length, knownTotal)}
        </slot>
      </div>
    {:else if loadable}
      {#if showCount && knownTotal !== undefined}
        <p class:bx--infinite-list__count={true}>
          {countText(keys.length, knownTotal)}
        </p>
      {/if}
      <Button
        bind:ref={buttonEl}
        kind="tertiary"
        loading={phase === "more"}
        on:click={onLoadMoreClick}
      >
        {phase === "more" ? loadingMoreText : loadMoreText}
      </Button>
    {:else if keys.length > 0}
      <div class:bx--infinite-list__note={true}>
        <slot name="end" count={keys.length} total={knownTotal}>
          {endText}
        </slot>
      </div>
    {/if}
  </div>
  <div
    bind:this={afterEl}
    id="{baseId}-end"
    class:bx--infinite-list__after={true}
    tabindex="-1"
  ></div>
  <div class:bx--visually-hidden={true} role="status">
    {#if message}
      {#key messageStamp}
        <span>{message}</span>
      {/key}
    {/if}
  </div>
</div>
