<script>
  /**
   * @restProps {div}
   * @event {{ selectedId: string }} change - Fires when the selection changes: the user picked an item, went back or forward, or the URL restored an id on mount. It does not fire when you set `selectedId` yourself.
   * @slot {{ selectedId: string; select: (id: string) => void; hrefFor: (id: string) => string }} list - The list of items, such as a `ContainedList` of `ListDetailItem`.
   * @slot {{ selectedId: string; back: () => void }} detail - The details of the selected item. Its first heading takes focus when the layout shows one pane.
   * @slot {{}} empty - What the detail pane shows while nothing is selected.
   * @slot {{}} loadingChildren - What the detail pane shows while `loading` is `true`.
   */

  /**
   * Specify the id of the selected item. `""` selects nothing.
   * With `syncUrl`, the URL's `urlParam` parameter wins over it on mount.
   * @bindable writable
   */
  export let selectedId = "";

  /**
   * Set the width at which the list and the details sit side by side.
   * Below it, one pane shows: the list, or the details of the selected item.
   * The width is a Carbon breakpoint (`md` is 672px, `lg` 1056px, `xlg`
   * 1312px) because CSS cannot read a custom width in a container query.
   * @type {"md" | "lg" | "xlg"}
   */
  export let breakpoint = "md";

  /**
   * Set what the breakpoint measures. `"container"` is the layout's own
   * width, so it works in a panel or a dashboard tile. A container ignores
   * its content when it sizes itself, so the layout needs a width from its
   * parent (a block, or a flex or grid item with a width) and collapses to
   * nothing in a shrink-to-fit parent such as an inline block. `"viewport"`
   * measures the window and has no such limit.
   * @type {"container" | "viewport"}
   */
  export let responsiveTo = "container";

  /** Set to `true` to let the user drag the divider between the panes. */
  export let resizable = false;

  /**
   * Specify the width of the list pane as a percentage of the layout.
   * @bindable writable
   */
  export let listSize = 30;

  /**
   * Set the narrowest the list pane gets, as a percentage or a pixel
   * length such as `"280px"`.
   * @type {number | `${number}px`}
   */
  export let listMin = "280px";

  /**
   * Set the widest the list pane gets, as a percentage. It takes no pixel
   * length so the list can fill the layout when the panes stack.
   */
  export let listMax = 50;

  /**
   * Set to `true` while the details load. The pane shows the
   * "loadingChildren" slot, or a skeleton, and is marked busy.
   */
  export let loading = false;

  /**
   * Set to `false` to leave the URL alone, such as under a router that owns
   * history. Handle `change` and set `selectedId` yourself.
   * Read once, on mount.
   */
  export let syncUrl = true;

  /**
   * Specify the query parameter that holds the selected id.
   * Read once, on mount.
   */
  export let urlParam = "id";

  /**
   * Set how a selection enters the history. `"auto"` adds an entry when
   * only one pane shows, or when nothing was selected before, and
   * replaces the entry when the user moves from one item to another beside
   * the list, so Back does not step through every item.
   * @type {"auto" | "push" | "replace"}
   */
  export let historyMode = "auto";

  /** Specify the accessible name of the list region. */
  export let listLabel = "List";

  /**
   * Specify the accessible name of the details region.
   * Name it after the selected item for screen readers.
   */
  export let detailLabel = "Details";

  /** Specify the text of the button that returns from the details to the list. */
  export let backText = "Back to list";

  /** Specify the title shown in the details pane while nothing is selected. */
  export let emptyText = "Select an item";

  /** Specify the ARIA label for the divider between the panes. */
  export let separatorLabel = "Resize list";

  /**
   * Set an id for the top-level element.
   * The region ids derive from it as `{id}-list` and `{id}-detail`.
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the root element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  /**
   * Move focus to the details, the first heading in them. Use it when you
   * set `selectedId` yourself and want the user to land on the details.
   */
  export function focusDetail() {
    return settle("focus");
  }

  import { createEventDispatcher, onMount, setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import Button from "../Button/Button.svelte";
  import EmptyState from "../EmptyState/EmptyState.svelte";
  import SkeletonText from "../SkeletonText/SkeletonText.svelte";
  import Splitter from "../Splitter/Splitter.svelte";
  import ArrowLeft from "../icons/ArrowLeft.svelte";
  import { rovingFocus } from "../utils/roving-focus.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { syncSelectionToUrl } from "../utils/sync-selection-to-url.js";
  import { uniqueId } from "../utils/unique-id.js";

  const ITEM = "[data-list-detail-id]";
  const PANES = ":scope > .bx--list-detail__split";
  const HEADING = "h1, h2, h3, h4, h5, h6, [data-list-detail-heading]";

  const dispatch = createEventDispatcher();
  const url = syncSelectionToUrl({ param: urlParam });

  const selected = writable(selectedId);
  const hrefFor = writable(
    /** @type {(id: string) => string} */ (
      (id) => `?${urlParam}=${encodeURIComponent(id)}`
    ),
  );

  setContext("carbon:ListDetailLayout", { selected, hrefFor, select });

  /** @type {null | HTMLElement} */
  let listPane = null;
  /** @type {null | HTMLElement} */
  let detailPane = null;
  /** @type {null | HTMLElement} */
  let body = null;
  let announcement = "";
  let mounted = false;
  // The last value this component wrote or read, to tell a change made from
  // outside (the parent set `selectedId`) from one it made itself.
  let prevSelectedId = selectedId;
  let prevLoading = loading;
  // What to do once the details have rendered.
  /** @type {null | "focus" | "announce"} */
  let pending = null;
  /** @type {null | "list" | "detail"} */
  let focusPane = null;
  /** @type {null | HTMLElement} */
  let tabStop = null;

  /** @returns {HTMLElement[]} */
  function items() {
    return listPane
      ? /** @type {HTMLElement[]} */ (
          Array.from(listPane.querySelectorAll(ITEM))
        )
      : [];
  }

  // The CSS decides what shows, so ask the DOM rather than repeat the
  // breakpoint in script: the divider is hidden exactly when the panes stack.
  function stacked() {
    if (!ref || ref.getClientRects().length === 0) return false;
    const separator = ref.querySelector(PANES + " > .bx--splitter__separator");
    return Boolean(separator) && separator?.getClientRects().length === 0;
  }

  // Exactly one tab stop in the list, so Tab crosses it in one press and the
  // arrow keys move within. Until this runs (no script) every link is one.
  /** @param {null | HTMLElement} [next] */
  function syncTabStops(next) {
    const all = items();
    if (all.length === 0) return;
    const stop =
      next ??
      (tabStop && all.includes(tabStop) ? tabStop : null) ??
      all.find((item) => item.dataset.listDetailId === selectedId) ??
      all[0];
    tabStop = stop;
    for (const item of all) {
      const tabindex = item === stop ? "0" : "-1";
      if (item.getAttribute("tabindex") !== tabindex) {
        item.setAttribute("tabindex", tabindex);
      }
    }
  }

  /** @param {FocusEvent} event */
  function handleFocusin(event) {
    const target = /** @type {Node} */ (event.target);
    focusPane = listPane?.contains(target)
      ? "list"
      : detailPane?.contains(target)
        ? "detail"
        : null;
    const item = /** @type {Element} */ (target).closest?.(ITEM);
    if (item && listPane?.contains(item)) {
      syncTabStops(/** @type {HTMLElement} */ (item));
    }
  }

  /** @param {FocusEvent} event */
  function handleFocusout(event) {
    // Focus that left to another place is no longer ours to restore. Focus
    // lost because its pane was hidden is, and the resize handler restores it.
    const pane = focusPane === "list" ? listPane : detailPane;
    if (!event.relatedTarget && pane && pane.getClientRects().length > 0) {
      focusPane = null;
    }
  }

  function handleResize() {
    // Without layout (a test DOM) every element looks hidden.
    if (!focusPane || !ref || ref.getClientRects().length === 0) return;
    const active = document.activeElement;
    // Chromium clears focus from a hidden element on a later task, so the
    // hidden element can still be the active one here.
    const lost =
      !active ||
      active === document.body ||
      active.getClientRects().length === 0;
    if (!lost) {
      focusPane = null;
      return;
    }
    const pane = focusPane === "list" ? listPane : detailPane;
    if (!pane || pane.getClientRects().length > 0) return;
    focusPane = null;
    // A hidden pane takes the focus with it; follow the one that is left.
    if (selectedId) settle("focus");
    else focusListItem(selectedId);
  }

  /** @param {string} itemId */
  function focusListItem(itemId) {
    const target =
      items().find((item) => item.dataset.listDetailId === itemId) ?? listPane;
    target?.focus();
  }

  /** @param {null | "focus" | "announce"} action */
  async function settle(action) {
    if (action) pending = action;
    await tick();
    if (!pending || !body) return;
    const heading = /** @type {null | HTMLElement} */ (
      body.querySelector(HEADING)
    );
    if (pending === "focus") {
      const target = heading ?? body;
      if (!target.hasAttribute("tabindex"))
        target.setAttribute("tabindex", "-1");
      target.focus();
      // Still loading: land on the pane now, on the heading once it renders.
      if (heading || !loading) pending = null;
    } else if (!loading) {
      announcement = heading?.textContent?.trim() ?? "";
      pending = null;
    }
  }

  /**
   * Select an item, as if the user picked it.
   * @param {string} next
   */
  export function select(next) {
    if (!next) {
      back();
      return;
    }
    commit(next, "user");
  }

  /**
   * Leave the details for the list: the Back button.
   * Steps back through history when the selection added an entry.
   */
  export function back() {
    if (!selectedId) return;
    commit("", "user");
  }

  /**
   * @param {string} next
   * @param {"user" | "history" | "url"} source
   */
  function commit(next, source) {
    const prev = selectedId;
    if (next === prev) return;
    const narrow = stacked();
    prevSelectedId = next;
    selectedId = next;
    dispatch("change", { selectedId: next });
    if (source === "user" && syncUrl) writeUrl(next, prev, narrow);
    if (source !== "url") afterChange(prev, next, narrow);
  }

  /**
   * @param {string} next
   * @param {string} prev
   * @param {boolean} narrow
   */
  function writeUrl(next, prev, narrow) {
    if (!next) {
      url.back();
      return;
    }
    const push =
      historyMode === "push" || (historyMode === "auto" && (narrow || !prev));
    if (push) url.push(next);
    else url.replace(next);
  }

  /**
   * @param {string} prev
   * @param {string} next
   * @param {boolean} narrow
   */
  async function afterChange(prev, next, narrow) {
    await tick();
    if (next) {
      const pane = ref?.querySelector(PANES + " > .bx--splitter__pane--end");
      if (pane) pane.scrollTop = 0;
      announcement = "";
      settle(narrow ? "focus" : "announce");
    } else if (narrow) {
      focusListItem(prev);
    }
  }

  /** @param {string} next */
  function handleHistory(next) {
    hrefFor.set((itemId) => url.hrefFor(itemId));
    commit(next, "history");
  }

  /** @param {string} next */
  function syncExternal(next) {
    prevSelectedId = next;
    if (mounted && syncUrl) url.replace(next);
  }

  /** @param {boolean} next */
  function syncLoading(next) {
    prevLoading = next;
    if (!next && pending) settle(null);
  }

  $: selected.set(selectedId);
  $: if (selectedId !== prevSelectedId) syncExternal(selectedId);
  $: if (loading !== prevLoading) syncLoading(loading);

  onMount(() => {
    mounted = true;
    let unlisten = () => {};
    if (syncUrl) {
      const fromUrl = url.read();
      if (fromUrl) commit(fromUrl, "url");
      else if (selectedId) url.replace(selectedId);
      unlisten = url.listen(handleHistory);
    }
    hrefFor.set((itemId) => url.hrefFor(itemId));
    syncTabStops();
    const stopObserving = ref ? observeResize(ref, handleResize) : () => {};
    const mutations = new MutationObserver(() => syncTabStops());
    if (listPane)
      mutations.observe(listPane, { childList: true, subtree: true });
    return () => {
      unlisten();
      stopObserving();
      mutations.disconnect();
    };
  });

  const rovingOptions = {
    selector: ITEM,
    orientation: /** @type {const} */ ("vertical"),
    wrap: false,
    focusOnMove: true,
    getActiveIndex: () =>
      items().indexOf(/** @type {HTMLElement} */ (document.activeElement)),
  };
</script>

<div
  bind:this={ref}
  {id}
  class:bx--list-detail={true}
  class:bx--list-detail--md={breakpoint === "md"}
  class:bx--list-detail--lg={breakpoint === "lg"}
  class:bx--list-detail--xlg={breakpoint === "xlg"}
  class:bx--list-detail--viewport={responsiveTo === "viewport"}
  class:bx--list-detail--selected={selectedId !== ""}
  on:focusin={handleFocusin}
  on:focusout={handleFocusout}
  {...$$restProps}
>
  <Splitter
    id="{id}-split"
    class="bx--list-detail__split"
    bind:size={listSize}
    min={listMin}
    max={listMax}
    disabled={!resizable}
    {separatorLabel}
  >
    <section
      slot="start"
      bind:this={listPane}
      id="{id}-list"
      class:bx--list-detail__list={true}
      aria-label={listLabel}
      tabindex="-1"
      use:rovingFocus={rovingOptions}
    >
      <slot name="list" {selectedId} {select} hrefFor={$hrefFor} />
    </section>
    <section
      slot="end"
      bind:this={detailPane}
      id="{id}-detail"
      class:bx--list-detail__detail={true}
      aria-label={detailLabel}
    >
      <div class:bx--list-detail__bar={true}>
        <Button kind="ghost" size="small" on:click={back}>
          <ArrowLeft class="bx--list-detail__back-icon" />
          {backText}
        </Button>
      </div>
      <div
        bind:this={body}
        class:bx--list-detail__body={true}
        aria-busy={loading ? "true" : undefined}
      >
        {#if loading}
          <slot name="loadingChildren">
            <SkeletonText heading width="40%" />
            <SkeletonText paragraph lines={4} />
          </slot>
        {:else if selectedId}
          <slot name="detail" {selectedId} {back} />
        {:else}
          <slot name="empty">
            <EmptyState title={emptyText} size="sm" />
          </slot>
        {/if}
      </div>
    </section>
  </Splitter>
  <div class:bx--visually-hidden={true} role="status">{announcement}</div>
</div>
