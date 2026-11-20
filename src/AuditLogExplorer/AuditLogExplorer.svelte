<script>
  /**
   * @typedef {import("./audit-source.js").AuditEvent} AuditEvent
   * @typedef {import("./audit-source.js").AuditSource} AuditSource
   * @typedef {import("./audit-source.js").AuditPage} AuditPage
   * @typedef {import("./audit-state.js").AuditField} AuditField
   * @typedef {import("./audit-state.js").AuditViewState} AuditViewState
   */

  /**
   * @restProps {div}
   * @event {AuditViewState} state - Dispatched after the query, the time range or live tail changes.
   */

  /**
   * Where events come from.
   * @type {AuditSource}
   */
  export let source;

  /**
   * The fields a query can use. A `facet` field gets a facet and a list of
   * values in the query bar; the others are text matches.
   * @type {ReadonlyArray<AuditField>}
   */
  export let fields;

  /**
   * The URL's query string. It is the whole view state: the query text, with
   * the facets in it, the time range and live tail.
   * @type {string | URLSearchParams | undefined}
   */
  export let url = undefined;

  /**
   * Set to `true` to keep the browser's address in step with the view state.
   * A new query is a history entry; a range or a live tail replaces it.
   */
  export let syncUrl = false;

  /**
   * The first page, when the server has already asked the source. It makes
   * the server render the rows, the counts and the facets; the browser then
   * asks for nothing until the state changes.
   * @type {AuditPage | undefined}
   */
  export let initialPage = undefined;

  /** Specify the events asked for per page. */
  export let pageSize = 100;

  /** Specify the most events the list loads. Beyond it the list asks to narrow the query. */
  export let maxLoaded = 5000;

  /** Specify the most events an export reads. */
  export let maxExport = 10_000;

  /** Specify a row's height in pixels. */
  export let rowHeight = 32;

  /**
   * Specify what "now" is for a relative time range. Defaults to the clock.
   * @type {number | undefined}
   */
  export let now = undefined;

  /**
   * Specify the height of the explorer. A number is in pixels.
   * @type {number | string}
   */
  export let height = "100%";

  /** Specify the label of the whole screen's search landmark. */
  export let labelText = "Audit events";

  /**
   * The event in the details panel, by `id`.
   * @type {string | null}
   * @bindable writable
   */
  export let selectedId = null;

  /**
   * Obtain a reference to the outer element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import CopyButton from "../CopyButton/CopyButton.svelte";
  import DatePicker from "../DatePicker/DatePicker.svelte";
  import DatePickerInput from "../DatePicker/DatePickerInput.svelte";
  import { datePresets } from "../DatePicker/date-presets.js";
  import DescriptionList from "../DescriptionList/DescriptionList.svelte";
  import DescriptionListItem from "../DescriptionList/DescriptionListItem.svelte";
  import Dropdown from "../Dropdown/Dropdown.svelte";
  import AppliedFilters from "../FilterPanel/AppliedFilters.svelte";
  import FilterPanel from "../FilterPanel/FilterPanel.svelte";
  import { createResultAnnouncer } from "../FilterPanel/result-announcer.js";
  import InlineLoading from "../InlineLoading/InlineLoading.svelte";
  import JsonViewer from "../JsonViewer/JsonViewer.svelte";
  import MenuItem from "../Menu/MenuItem.svelte";
  import MenuButton from "../MenuButton/MenuButton.svelte";
  import InlineNotification from "../Notification/InlineNotification.svelte";
  import RelativeTime from "../RelativeTime/RelativeTime.svelte";
  import SidePanel from "../SidePanel/SidePanel.svelte";
  import Tag from "../Tag/Tag.svelte";
  import TimePicker from "../TimePicker/TimePicker.svelte";
  import Toggle from "../Toggle/Toggle.svelte";
  import TokenSearch from "../TokenSearch/TokenSearch.svelte";
  import { parseQuery } from "../TokenSearch/token-query.js";
  import VirtualList from "../VirtualList/VirtualList.svelte";
  import ArrowDown from "../icons/ArrowDown.svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import Download from "../icons/Download.svelte";
  import { downloadFile } from "../utils/download-file.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { collectEvents, toCsv, toJson } from "./audit-export.js";
  import {
    facetsFromText,
    fromSearchParams,
    mergeOptions,
    resolveRange,
    schemaFromFields,
    textWithFacets,
    toAuditQuery,
    toSearchParams,
  } from "./audit-state.js";

  const dispatch = createEventDispatcher();
  const id = uniqueId();

  const RANGE_ITEMS = [
    { id: "15m", text: "Last 15 minutes" },
    { id: "1h", text: "Last hour" },
    { id: "24h", text: "Last 24 hours" },
    { id: "7d", text: "Last 7 days" },
    { id: "30d", text: "Last 30 days" },
    { id: "custom", text: "Custom range" },
  ];
  const COLUMNS = [
    { key: "time", label: "Time (UTC)" },
    { key: "actor", label: "Actor" },
    { key: "action", label: "Action" },
    { key: "target", label: "Target" },
    { key: "outcome", label: "Outcome" },
  ];
  const OUTCOME_TAG = /** @type {const} */ ({
    success: "green",
    failure: "red",
    denied: "magenta",
  });
  const TIME = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const NUMBER = new Intl.NumberFormat("en");

  /** @param {string} iso */
  function formatTime(iso) {
    return TIME.format(new Date(iso));
  }

  /** @param {number} n */
  function format(n) {
    return NUMBER.format(n);
  }

  // The view state. `committed` is the query the list shows; `text` is what
  // the query bar holds, which runs ahead of it until Enter.
  const initial = fromSearchParams(url);
  let committed = initial.q;
  let text = initial.q;
  /** @type {import("./audit-state.js").TimeRangeState} */
  let range = initial.range;
  let live = initial.live;

  /** @type {Record<string, string[]>} */
  let optionsByField = Object.fromEntries(
    fields.filter((f) => f.facet).map((f) => [f.key, [...(f.values ?? [])]]),
  );
  /** @type {string[]} */
  let recent = [];

  $: schema = schemaFromFields(fields, optionsByField);
  $: facetField = fields.filter((f) => f.facet).map((f) => f.key);
  $: facetRead = facetsFromText(committed, schema.facets, schema.keys);
  $: facetValue = facetRead.state;

  // The result.
  /** @type {AuditEvent[]} */
  let events = initialPage?.events ?? [];
  /** @type {string | null} */
  let nextCursor = initialPage?.nextCursor ?? null;
  /** @type {number | undefined} */
  let total = initialPage?.total;
  /** @type {Record<string, Record<string, number>> | undefined} */
  let counts = initialPage?.facets;
  let loading = !initialPage;
  let loadingMore = false;
  /** @type {string | null} */
  let error = null;
  let queryMs = 0;
  let generation = 0;
  /** @type {AbortController | null} */
  let controller = null;
  /** The window of the first page, kept for the pages after it. */
  let pinned = resolveRange(range, now);

  $: if (initialPage?.facets) {
    for (const f of facetField) {
      optionsByField[f] = mergeOptions(
        optionsByField[f] ?? [],
        initialPage.facets[f],
        [],
      );
    }
  }

  // Live tail.
  /** @type {AuditEvent[]} */
  let pending = [];
  /** @type {AbortController | null} */
  let tailController = null;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let flushTimer;
  let added = 0;

  // The list.
  /** @type {HTMLDivElement | null} */
  let scroller = null;
  let viewport = 0;
  let scrollTop = 0;
  let activeIndex = -1;
  let gridFocused = false;
  const OVERSCAN = 4;

  $: atTop = scrollTop < rowHeight / 2;
  $: visibleCount = Math.max(1, Math.ceil((viewport || 640) / rowHeight));
  $: firstRendered = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
  $: lastRendered = firstRendered + visibleCount + OVERSCAN * 2;
  $: activeVisible =
    activeIndex >= firstRendered &&
    activeIndex <= lastRendered &&
    activeIndex < events.length;
  $: activeRowId =
    activeVisible && events[activeIndex]
      ? rowId(events[activeIndex])
      : undefined;
  // The panel keeps showing the last event it was given while it slides out,
  // and while a new query replaces the list under it.
  /** @type {AuditEvent | undefined} */
  let selected;
  $: if (selectedId !== null) {
    selected = events.find((event) => event.id === selectedId) ?? selected;
  }

  /** @param {AuditEvent} event */
  function rowId(event) {
    return `${id}-${event.id}`;
  }

  // Time range controls.
  let customOpen = !("preset" in range);
  $: rangeId = customOpen
    ? "custom"
    : "preset" in range
      ? range.preset
      : "custom";
  let fromDate = "preset" in range ? "" : range.from.slice(0, 10);
  let toDate = "preset" in range ? "" : range.to.slice(0, 10);
  let fromTime = "preset" in range ? "" : range.from.slice(11);
  let toTime = "preset" in range ? "" : range.to.slice(11);
  const TIME_PATTERN = "([01]?[0-9]|2[0-3]):[0-5][0-9]";

  /** @param {string} t */
  function padTime(t) {
    const [h, m] = t.split(":");
    return `${h.padStart(2, "0")}:${m}`;
  }

  function applyCustom() {
    const okTime = (/** @type {string} */ t) =>
      t === "" || new RegExp(`^${TIME_PATTERN}$`).test(t);
    if (!okTime(fromTime) || !okTime(toTime)) return;
    const from = fromDate ? `${fromDate}T${padTime(fromTime || "00:00")}` : "";
    const to = toDate ? `${toDate}T${padTime(toTime || "23:59")}` : "";
    if (!from && !to) return;
    range = { from, to };
    if (to) live = false;
    commit(committed, "replace");
  }

  /** @param {CustomEvent<{ selectedId: string }>} event */
  function pickRange(event) {
    const next = event.detail.selectedId;
    if (next === "custom") {
      customOpen = true;
      return;
    }
    customOpen = false;
    range = { preset: /** @type {any} */ (next) };
    commit(committed, "replace");
  }

  // Announcements, throttled: the count after a query settles, and the
  // arrivals of a live tail at a slower pace.
  const resultsAnnouncer = createResultAnnouncer(total, 800);
  const tailAnnouncer = createResultAnnouncer(undefined, 6000);
  $: resultsAnnouncer.track(
    loading ? undefined : countLabelValue,
    (n) =>
      `${format(n)} ${n === 1 ? "event" : "events"}${total === undefined ? " loaded" : ""}`,
  );
  $: tailAnnouncer.track(
    pending.length > 0 && !atTop ? pending.length : undefined,
    (n) => `${format(n)} new ${n === 1 ? "event" : "events"} available`,
  );
  $: countLabelValue = total === undefined ? events.length : total + added;

  // Running a query.

  function currentParams() {
    return {
      // Read `committed` afresh: `commit` runs before the reactive `tokenQuery` does.
      ...toAuditQuery(parseQuery(committed, { keys: schema.keys })),
      range: pinned,
    };
  }

  /** @param {boolean} more */
  async function run(more) {
    if (!source) return;
    controller?.abort();
    const mine = new AbortController();
    controller = mine;
    const gen = ++generation;
    const started = typeof performance === "undefined" ? 0 : performance.now();
    if (more) {
      if (!nextCursor || events.length >= maxLoaded) return;
      loadingMore = true;
    } else {
      loading = true;
      pinned = resolveRange(range, now);
    }
    error = null;
    try {
      const page = await source.query({
        ...currentParams(),
        cursor: more ? nextCursor : undefined,
        limit: pageSize,
        facets: more ? undefined : facetField,
        signal: mine.signal,
      });
      if (gen !== generation) return;
      nextCursor = page.nextCursor;
      if (more) {
        const seen = new Set(events.map((event) => event.id));
        events = events.concat(page.events.filter((e) => !seen.has(e.id)));
      } else {
        events = page.events;
        total = page.total;
        added = 0;
        pending = [];
        counts = page.facets;
        if (page.facets) {
          for (const f of facetField) {
            const chosen = /** @type {string[]} */ (
              facetsFromText(committed, schema.facets, schema.keys).state[f] ??
                []
            ).map(String);
            optionsByField[f] = mergeOptions(
              optionsByField[f] ?? [],
              page.facets[f],
              chosen,
            );
          }
          optionsByField = optionsByField;
        }
        activeIndex = events.length ? Math.min(activeIndex, 0) : -1;
        if (scroller) scroller.scrollTop = 0;
        scrollTop = 0;
      }
    } catch (cause) {
      if (/** @type {Error} */ (cause)?.name === "AbortError") return;
      if (gen !== generation) return;
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      if (gen === generation) {
        loading = false;
        loadingMore = false;
        await tick();
        if (typeof performance !== "undefined" && started) {
          queryMs = Math.round(performance.now() - started);
        }
      }
    }
  }

  /**
   * Make a text the query, write it to the address and ask the source.
   * @param {string} next
   * @param {"push" | "replace"} history
   */
  function commit(next, history) {
    committed = next;
    text = next;
    if (next && !recent.includes(next)) recent = [next, ...recent].slice(0, 8);
    writeUrl(history);
    dispatch("state", currentState());
    stopTail();
    run(false).then(startTail);
  }

  function currentState() {
    return { q: committed, range, live };
  }

  function writeUrl(/** @type {"push" | "replace"} */ how) {
    if (!syncUrl || typeof window === "undefined") return;
    const params = toSearchParams(currentState()).toString();
    const href = `${window.location.pathname}${params ? `?${params}` : ""}${window.location.hash}`;
    if (
      href ===
      `${window.location.pathname}${window.location.search}${window.location.hash}`
    )
      return;
    if (how === "push") window.history.pushState(null, "", href);
    else window.history.replaceState(null, "", href);
  }

  /** @param {PopStateEvent} _ */
  function onPopState(_) {
    const next = fromSearchParams(window.location.search);
    committed = text = next.q;
    range = next.range;
    live = next.live;
    customOpen = !("preset" in range);
    stopTail();
    run(false).then(startTail);
  }

  /** @param {CustomEvent<Record<string, unknown>>} event */
  function onFacets(event) {
    commit(
      textWithFacets(text, schema.facets, event.detail, schema.keys),
      "push",
    );
  }

  function onSearch() {
    commit(text, "push");
  }

  function onClear() {
    commit("", "push");
  }

  function loadMore() {
    if (loading || loadingMore || !nextCursor) return;
    run(true);
  }

  // Live tail.

  function startTail() {
    stopTail();
    if (!live || !source.tail || typeof window === "undefined") return;
    const mine = new AbortController();
    tailController = mine;
    source.tail(
      { ...currentParams(), range: { from: null, to: null }, limit: 1 },
      { signal: mine.signal, onEvents: onTail },
    );
  }

  function stopTail() {
    tailController?.abort();
    tailController = null;
  }

  /** @param {AuditEvent[]} incoming oldest first */
  function onTail(incoming) {
    pending = incoming.slice().reverse().concat(pending);
    if (atTop && !flushTimer) flushTimer = setTimeout(flushAtTop, 120);
  }

  // The list may have been scrolled away since the timer was set.
  function flushAtTop() {
    flushTimer = undefined;
    if (atTop) flush();
  }

  function flush() {
    flushTimer = undefined;
    if (pending.length === 0) return;
    const fresh = pending;
    pending = [];
    added += fresh.length;
    events = fresh.concat(events);
    if (activeIndex >= 0) activeIndex += fresh.length;
  }

  async function showNew() {
    flush();
    await tick();
    if (scroller) scroller.scrollTop = 0;
    scrollTop = 0;
  }

  function setLive(/** @type {boolean} */ next) {
    live = next;
    writeUrl("replace");
    dispatch("state", currentState());
    if (live) {
      startTail();
    } else {
      stopTail();
      pending = [];
    }
  }

  /** @param {CustomEvent<{ toggled: boolean }>} event */
  function onLive(event) {
    setLive(event.detail.toggled);
  }

  // Scrolling and the grid's keys.

  function onScroll() {
    if (!scroller) return;
    scrollTop = scroller.scrollTop;
    if (atTop && pending.length > 0 && !flushTimer) flush();
  }

  /**
   * Scroll a row into view, below the sticky header row, which is one row tall.
   * @param {number} index
   */
  async function reveal(index) {
    if (!scroller) return;
    const top = index * rowHeight;
    const bottom = top + rowHeight;
    if (top < scroller.scrollTop) scroller.scrollTop = top;
    else if (bottom + rowHeight > scroller.scrollTop + scroller.clientHeight) {
      scroller.scrollTop = bottom + rowHeight - scroller.clientHeight;
    }
    scrollTop = scroller.scrollTop;
    await tick();
  }

  /** @param {number} index */
  async function activate(index) {
    if (events.length === 0) return;
    activeIndex = Math.max(0, Math.min(events.length - 1, index));
    // With the panel open it follows the row, so arrows browse the events.
    if (selectedId !== null) selectedId = events[activeIndex].id;
    await reveal(activeIndex);
    if (activeIndex >= events.length - 10) loadMore();
  }

  /** @param {KeyboardEvent} event */
  function onRootKeydown(event) {
    // A slide-in panel does not close on Escape, so the screen does it, and
    // puts the user back in the list.
    if (
      event.key === "Escape" &&
      selectedId !== null &&
      !event.defaultPrevented &&
      event.target instanceof Element &&
      event.target.closest(".bx--side-panel")
    ) {
      selectedId = null;
      scroller?.focus();
    }
  }

  /** @param {KeyboardEvent} event */
  function onGridKeydown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const page = Math.max(1, visibleCount - 1);
    const from = Math.max(0, activeIndex);
    switch (event.key) {
      case "ArrowDown":
        activate(activeIndex < 0 ? 0 : from + 1);
        break;
      case "ArrowUp":
        activate(from - 1);
        break;
      case "PageDown":
        activate(from + page);
        break;
      case "PageUp":
        activate(from - page);
        break;
      case "Home":
        activate(0);
        break;
      case "End":
        activate(events.length - 1);
        break;
      case "Enter":
      case " ":
        if (activeIndex >= 0) open(events[activeIndex]);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  /** @param {AuditEvent} event */
  function open(event) {
    selectedId = event.id;
    activeIndex = events.indexOf(event);
  }

  /** @param {number} delta */
  function step(delta) {
    const at = events.findIndex((event) => event.id === selectedId);
    const next = events[at + delta];
    if (next) {
      selectedId = next.id;
      activate(at + delta);
    }
  }

  // Export.

  let exporting = false;
  let exportCount = 0;
  /** @param {"csv" | "json"} how */
  async function exportEvents(how) {
    if (exporting) return;
    exporting = true;
    exportCount = 0;
    try {
      const { events: all } = await collectEvents(source, currentParams(), {
        limit: maxExport,
        onProgress: (n) => {
          exportCount = n;
        },
      });
      const stamp = new Date().toISOString().slice(0, 10);
      if (how === "csv") {
        downloadFile(
          toCsv(all),
          `audit-events-${stamp}.csv`,
          "text/csv;charset=utf-8",
        );
      } else {
        downloadFile(
          toJson(all),
          `audit-events-${stamp}.json`,
          "application/json",
        );
      }
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      exporting = false;
    }
  }

  // Lifecycle.

  onMount(() => {
    window.addEventListener("popstate", onPopState);
    if (initialPage) startTail();
    else run(false).then(startTail);
    return () => {
      stopTail();
      controller?.abort();
      clearTimeout(flushTimer);
      resultsAnnouncer.cancel();
      tailAnnouncer.cancel();
      window.removeEventListener("popstate", onPopState);
    };
  });

  $: closedRange = !("preset" in range) && range.to !== "";
  $: heightStyle = typeof height === "number" ? `${height}px` : height;
  $: shown = events.length;
  $: exhausted = !nextCursor;
  $: capped = !!nextCursor && events.length >= maxLoaded;
  $: filterCount = Object.keys(facetValue).length;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  bind:this={ref}
  class="bx--audit-log"
  style:height={heightStyle}
  data-query-ms={queryMs}
  data-loaded={shown}
  {...$$restProps}
  on:keydown={onRootKeydown}
>
  <div class="bx--audit-log__query" role="region" aria-label={labelText}>
    <div class="bx--audit-log__search">
      <TokenSearch
        bind:value={text}
        keys={schema.keys}
        recentQueries={recent}
        labelText="Search events"
        hideLabel
        placeholder="Search events, or filter with actor:, action:, outcome:"
        size="lg"
        shortcut="/"
        on:search={onSearch}
        on:clear={onClear}
      />
    </div>
    <div class="bx--audit-log__range">
      <Dropdown
        size="lg"
        hideLabel
        labelText="Time range"
        selectedId={rangeId}
        items={RANGE_ITEMS}
        on:select={pickRange}
      />
    </div>
    <div class="bx--audit-log__live">
      <Toggle
        size="sm"
        labelText="Live tail"
        labelA="Off"
        labelB="On"
        toggled={live}
        disabled={!source.tail || closedRange}
        on:toggle={onLive}
      />
    </div>
    <div class="bx--audit-log__export">
      <MenuButton
        labelText={exporting ? `Exporting ${format(exportCount)}` : "Export"}
        kind="tertiary"
        size="lg"
        disabled={exporting || shown === 0}
        icon={Download}
      >
        <MenuItem labelText="CSV" on:click={() => exportEvents("csv")} />
        <MenuItem labelText="JSON" on:click={() => exportEvents("json")} />
      </MenuButton>
    </div>
    {#if customOpen}
      <div class="bx--audit-log__custom">
        <DatePicker
          datePickerType="range"
          dateFormat="Y-m-d"
          bind:valueFrom={fromDate}
          bind:valueTo={toDate}
          presets={[
            { label: "Today", value: datePresets.today },
            { label: "Yesterday", value: datePresets.yesterday },
            { label: "Last 7 days", value: datePresets.lastDays(7) },
            { label: "Last 30 days", value: datePresets.lastDays(30) },
          ]}
          on:change={applyCustom}
        >
          <DatePickerInput
            labelText="From date (UTC)"
            placeholder="yyyy-mm-dd"
          />
          <DatePickerInput labelText="To date (UTC)" placeholder="yyyy-mm-dd" />
        </DatePicker>
        <TimePicker
          labelText="From time"
          placeholder="hh:mm"
          pattern={TIME_PATTERN}
          bind:value={fromTime}
          on:change={applyCustom}
        />
        <TimePicker
          labelText="To time"
          placeholder="hh:mm"
          pattern={TIME_PATTERN}
          bind:value={toTime}
          on:change={applyCustom}
        />
      </div>
    {/if}
  </div>

  <div class="bx--audit-log__body">
    <aside
      class="bx--audit-log__facets"
      aria-label="Filters"
      data-has-filters={filterCount > 0 ? "" : undefined}
    >
      <FilterPanel
        facets={schema.facets}
        value={facetValue}
        {counts}
        hideTitle={false}
        hideResultCount
        zeroCounts="disable"
        title="Filters"
        on:change={onFacets}
      />
    </aside>

    <main class="bx--audit-log__results" aria-label="Events">
      <div class="bx--audit-log__status">
        <p class="bx--audit-log__count" aria-hidden="true">
          {#if loading && events.length === 0}
            Loading events
          {:else if total !== undefined}
            {format(total + added)} {total + added === 1 ? "event" : "events"}
          {:else}
            {format(shown)}+ events
          {/if}
        </p>
        {#if loading || loadingMore}
          <InlineLoading description="Loading" />
        {/if}
        <AppliedFilters
          facets={schema.facets}
          value={facetValue}
          on:change={onFacets}
        />
      </div>

      {#if error}
        <InlineNotification
          kind="error"
          lowContrast
          hideCloseButton
          title="Could not load events"
          subtitle={error}
        />
      {/if}

      <div class="bx--audit-log__table">
        {#if pending.length > 0 && !atTop}
          <div class="bx--audit-log__new">
            <Button kind="primary" size="sm" on:click={showNew}>
              {pending.length > 999 ? "999+" : format(pending.length)} new {pending.length ===
              1
                ? "event"
                : "events"}
            </Button>
          </div>
        {/if}
        <!-- The focusable grid. Rows are never focused: the grid points at the
          active row, so a row can scroll out and back without losing its place. -->
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <div
          bind:this={scroller}
          bind:clientHeight={viewport}
          class="bx--audit-log__grid"
          class:bx--audit-log__grid--busy={loading}
          role="grid"
          tabindex="0"
          aria-label="Events, newest first"
          aria-rowcount={total === undefined ? -1 : total + added + 1}
          aria-colcount={COLUMNS.length}
          aria-busy={loading ? "true" : undefined}
          aria-activedescendant={activeRowId}
          on:scroll={onScroll}
          on:keydown={onGridKeydown}
          on:focus={() => {
            gridFocused = true;
            if (activeIndex < 0 && events.length) activeIndex = 0;
          }}
          on:blur={() => (gridFocused = false)}
        >
          <div
            class="bx--audit-log__row bx--audit-log__row--head"
            role="row"
            aria-rowindex="1"
          >
            {#each COLUMNS as column, index (column.key)}
              <div
                class="bx--audit-log__cell bx--audit-log__cell--{column.key}"
                role="columnheader"
                aria-colindex={index + 1}
              >
                {column.label}
              </div>
            {/each}
          </div>
          <VirtualList
            items={events}
            itemHeight={rowHeight}
            containerHeight={viewport || 640}
            overscan={OVERSCAN}
            scrollElement={scroller}
            spacerTag="div"
            getKey={(item) => item.id}
            on:scrollend={loadMore}
            let:item
            let:index
          >
            <!-- The grid takes the keys and points at the active row, so a
                  row is never focused itself. -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-interactive-supports-focus -->
            <div
              id={rowId(item)}
              class="bx--audit-log__row"
              class:bx--audit-log__row--active={gridFocused &&
                index === activeIndex}
              class:bx--audit-log__row--selected={item.id === selectedId}
              role="row"
              aria-rowindex={index + 2}
              aria-selected={item.id === selectedId ? "true" : "false"}
              data-outcome={item.outcome}
              on:click={() => open(item)}
            >
              <div
                class="bx--audit-log__cell bx--audit-log__cell--time"
                dir="ltr"
                role="gridcell"
                aria-colindex="1"
              >
                <time datetime={item.time}>{formatTime(item.time)}</time>
              </div>
              <div
                class="bx--audit-log__cell bx--audit-log__cell--actor"
                dir="ltr"
                role="gridcell"
                aria-colindex="2"
                title={item.actor}
              >
                {item.actor}
              </div>
              <div
                class="bx--audit-log__cell bx--audit-log__cell--action"
                dir="ltr"
                role="gridcell"
                aria-colindex="3"
                title={item.action}
              >
                {item.action}
              </div>
              <div
                class="bx--audit-log__cell bx--audit-log__cell--target"
                dir="ltr"
                role="gridcell"
                aria-colindex="4"
                title={item.target}
              >
                {item.target}
              </div>
              <div
                class="bx--audit-log__cell bx--audit-log__cell--outcome"
                role="gridcell"
                aria-colindex="5"
              >
                <Tag size="sm" type={OUTCOME_TAG[item.outcome]}
                  >{item.outcome}</Tag
                >
              </div>
            </div>
          </VirtualList>
        </div>
        {#if !loading && events.length === 0 && !error}
          <div class="bx--audit-log__empty">
            <p class="bx--audit-log__empty-title">No events match</p>
            <p>Widen the time range or remove a filter.</p>
            {#if committed}
              <Button
                kind="tertiary"
                size="sm"
                on:click={() => commit("", "push")}
              >
                Clear the query
              </Button>
            {/if}
          </div>
        {/if}
      </div>

      <div class="bx--audit-log__footer">
        {#if capped}
          <p>
            Showing the newest {format(shown)} events. Narrow the query to see older
            ones.
          </p>
        {:else if !exhausted}
          <Button
            kind="ghost"
            size="sm"
            disabled={loadingMore}
            on:click={loadMore}
          >
            Load more events
          </Button>
        {:else if shown > 0}
          <p>End of the events for this query.</p>
        {/if}
      </div>
    </main>
  </div>

  <SidePanel
    open={selectedId !== null}
    size="lg"
    slideIn
    selectorPageContent=".bx--audit-log"
    title={selected ? selected.action : ""}
    subtitle={selected ? selected.id : ""}
    labelText="Event details"
    on:close={() => {
      selectedId = null;
    }}
  >
    <svelte:fragment slot="toolbar">
      <Button
        kind="ghost"
        size="sm"
        iconOnly
        icon={ArrowUp}
        data-modal-primary-focus
        iconDescription="Newer event"
        disabled={!selected || events.indexOf(selected) <= 0}
        on:click={() => step(-1)}
      />
      <Button
        kind="ghost"
        size="sm"
        iconOnly
        icon={ArrowDown}
        iconDescription="Older event"
        disabled={!selected || events.indexOf(selected) >= events.length - 1}
        on:click={() => step(1)}
      />
    </svelte:fragment>
    {#if selected}
      <div class="bx--audit-log__details">
        <DescriptionList gap={4}>
          <DescriptionListItem term="Time">
            <time datetime={selected.time}>{selected.time}</time>
            (<RelativeTime date={selected.time} />)
          </DescriptionListItem>
          <DescriptionListItem term="Outcome">
            <Tag size="sm" type={OUTCOME_TAG[selected.outcome]}
              >{selected.outcome}</Tag
            >
          </DescriptionListItem>
          {#each [["Actor", selected.actor], ["Target", selected.target], ["IP address", selected.ip], ["Event ID", selected.id]] as [label, value] (label)}
            <DescriptionListItem term={label}>
              <span class="bx--audit-log__copyable">
                <span>{value}</span>
                <CopyButton
                  size="sm"
                  kind="ghost"
                  text={value}
                  iconDescription="Copy {label.toLowerCase()}"
                />
              </span>
            </DescriptionListItem>
          {/each}
        </DescriptionList>
        <JsonViewer
          value={selected.payload}
          expandDepth={2}
          height={320}
          labelText="Payload"
        />
      </div>
    {/if}
  </SidePanel>

  <p class="bx--visually-hidden" role="status">{$resultsAnnouncer}</p>
  <p class="bx--visually-hidden" role="status">{$tailAnnouncer}</p>
</div>
