<script>
  /**
   * @restProps {div}
   * @slot {{}} empty - Shown when there is no activity.
   * @event {{ id: string; emoji: string }} react - A reaction was toggled. Update the item, or call `react` on a `createActivityFeed` store.
   * @event {{ parentId: string; body: string }} reply
   * @event {{ id: string; body: string }} edit
   * @event {{ id: string }} delete - The reader confirmed the deletion.
   * @event {{ id: string }} retry - Retry a comment that was not sent.
   * @event {{ id: string }} discard - Discard a comment that was not sent.
   * @event {null} load:older - The "Load older" button was pressed.
   * @event {{ id: number }} dismiss - A notice of an undone change was dismissed.
   */

  /**
   * The activity in time order, oldest first: comments, with their replies,
   * and events.
   * @type {ReadonlyArray<import("./activity-feed.js").ActivityItem>}
   */
  export let items = [];

  /**
   * The person using the feed. Their comments can be edited and deleted, and
   * their reactions are the pressed ones. Without it, the feed is read-only.
   * @type {import("./activity-feed.js").ActivityUser | undefined}
   */
  export let user = undefined;

  /**
   * People who are named by id in reactions but wrote nothing in the feed.
   * @type {ReadonlyArray<import("./activity-feed.js").ActivityUser>}
   */
  export let users = [];

  /** Specify the accessible name of the feed */
  export let labelText = "Activity";

  /**
   * Set to `true` when older items can be loaded. The feed then shows the
   * "Load older" button and `aria-setsize` is unknown (`-1`).
   */
  export let hasOlder = false;

  /** Set to `true` while older items load. The feed is `aria-busy`. */
  export let loadingOlder = false;

  /**
   * Notices of changes that were undone, from the `errors` of a
   * `createActivityFeed` store.
   * @type {ReadonlyArray<import("./activity-store.js").ActivityRollback>}
   */
  export let errors = [];

  /**
   * Fix the time that relative times and day dividers count from, so the
   * server and the browser print the same. Times then no longer update.
   * @type {number | Date | undefined}
   */
  export let now = undefined;

  /**
   * The locale of times and dates. The runtime's when unset.
   * @type {string | undefined}
   */
  export let locale = undefined;

  /**
   * The IANA time zone where days begin. Set it so the server and the
   * browser draw the same dividers.
   * @type {string | undefined}
   */
  export let timeZone = undefined;

  /**
   * The reactions a reader can add, in order. A reaction in the data that is
   * not listed still shows.
   * @type {ReadonlyArray<{ emoji: string; label: string }>}
   */
  export let reactions = DEFAULT_REACTIONS;

  /**
   * The people that `@` completes in the reply and edit fields.
   * @type {ReadonlyArray<import("../Mentions/Mentions.svelte").MentionItem>}
   */
  export let mentionItems = [];

  /**
   * Set a key to keep unsent replies and edits in `localStorage`. Each field
   * adds its own suffix.
   * @type {string | undefined}
   */
  export let draftKey = undefined;

  /**
   * Specify the most replies a thread shows before the earlier ones fold
   * into a "Show N earlier replies" button.
   */
  export let replyLimit = 2;

  /** Specify the most events of a group shown before the rest fold away */
  export let eventGroupLimit = 3;

  /** Set to `false` to draw every event on its own row */
  export let groupEvents = true;

  /**
   * Specify how far apart events may be, in milliseconds, and still share a
   * group. Default 6 hours.
   */
  export let groupWindowMs = 6 * 3_600_000;

  /**
   * Set to `true` to render only the rows near the viewport. Rows are
   * measured, so comments of any height work. Use it above a few hundred
   * rows; below that the browser does this work itself, see `lazyRows`.
   */
  export let virtual = false;

  /**
   * Set to `false` to draw every row in full, even those far off screen. By
   * default rows outside the viewport are skipped by the browser
   * (`content-visibility: auto`), which is cheap and keeps find in page and
   * screen reader navigation.
   */
  export let lazyRows = true;

  /**
   * Specify the height of the feed. It then scrolls itself, begins at the
   * newest item and follows new ones while the reader is at the end. Leave it
   * unset to let the page scroll.
   * @type {number | string | undefined}
   */
  export let height = undefined;

  /**
   * Replace some of the texts. Each key is a string or a function, and the
   * rest stay in English.
   * @type {Partial<import("./activity-texts.js").ActivityTexts>}
   */
  export let texts = {};

  /**
   * Obtain a reference to the element that scrolls.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Scroll to the newest item.
   * @type {() => void}
   */
  export function scrollToEnd() {
    toEnd();
  }

  /**
   * Move focus to the article of an item, loading nothing.
   * @type {(key: string) => boolean}
   */
  export function focusItem(key) {
    return focusRow(key);
  }

  import { createEventDispatcher, onMount, setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import Button from "../Button/Button.svelte";
  import InlineNotification from "../Notification/InlineNotification.svelte";
  import VirtualList from "../VirtualList/VirtualList.svelte";
  import { toCssLength } from "../utils/css-length.js";
  import { toTimestamp } from "../utils/relative-time.js";
  import {
    observeIntersection,
    observeResize,
  } from "../utils/shared-observer.js";
  import ActivityRow from "./ActivityRow.svelte";
  import { ACTIVITY_FEED_CONTEXT } from "./activity-context.js";
  import { buildRows, itemKey, itemTime } from "./activity-feed.js";
  import { DEFAULT_REACTIONS, DEFAULT_TEXTS } from "./activity-texts.js";

  const dispatch = createEventDispatcher();

  /** @type {null | HTMLDivElement} */
  let listRef = null;
  /** @type {null | HTMLDivElement} */
  let endRef = null;
  let editingId = "";
  let replyingId = "";
  let deletingId = "";
  /** @type {Set<string>} */
  let expandedReplies = new Set();
  /** @type {Set<string>} */
  let expandedEvents = new Set();
  let atEnd = true;
  let newCount = 0;
  let announcement = "";

  /** @type {Map<string, number>} */
  const known = new Map();
  let oldestKnown = Number.POSITIVE_INFINITY;
  let initialized = false;
  let mounted = false;
  let focusOlder = false;
  // True while a bounded feed follows its end: from the first paint until the
  // reader scrolls up. Rows measured after they mount change the height.
  let stick = true;
  let viewportHeight = 600;

  $: t = { ...DEFAULT_TEXTS, ...texts };
  $: referenceNow = now == null ? undefined : toTimestamp(now);
  $: rows = buildRows(items, { timeZone, groupEvents, groupWindowMs });
  $: setsize = hasOlder ? -1 : rows.length;
  $: names = new Map(
    [
      ...users,
      ...items
        .flatMap((item) => [item, ...(item.replies ?? [])])
        .map((item) => item.author),
    ].map((person) => [person.id, person.name]),
  );
  $: nameOf = (/** @type {string} */ id) => names.get(id) ?? id;

  // The rows read the settings from context, and the per-row state through
  // props, so a keystroke in one editor does not wake the other rows.
  const config = writable(
    /** @type {import("./activity-context.js").ActivityConfig} */ ({}),
  );
  setContext(ACTIVITY_FEED_CONTEXT, config);

  /** @param {Set<string>} set @param {string} key */
  function toggled(set, key) {
    const next = new Set(set);
    if (!next.delete(key)) next.add(key);
    return next;
  }

  const handlers = {
    /** @param {string} id @param {string} emoji */
    react(id, emoji) {
      dispatch("react", { id, emoji });
    },
    /** @param {string} id */
    startEdit(id) {
      deletingId = "";
      editingId = id;
    },
    cancelEdit() {
      editingId = "";
    },
    /** @param {string} id @param {string} body */
    saveEdit(id, body) {
      editingId = "";
      dispatch("edit", { id, body });
    },
    /** @param {string} id */
    askDelete(id) {
      editingId = "";
      deletingId = id;
    },
    cancelDelete() {
      deletingId = "";
    },
    /** @param {string} id */
    confirmDelete(id) {
      deletingId = "";
      const index = rows.findIndex((row) => row.key === keyOf(id));
      const neighbor = rows[index + 1] ?? rows[index - 1];
      dispatch("delete", { id });
      // The row is about to go; keep the reader's place in the feed.
      if (neighbor) tick().then(() => focusRow(neighbor.key));
    },
    /** @param {string} id */
    startReply(id) {
      replyingId = id;
    },
    cancelReply() {
      replyingId = "";
    },
    /** @param {string} parentId @param {string} body */
    submitReply(parentId, body) {
      replyingId = "";
      dispatch("reply", { parentId, body });
    },
    /** @param {string} id */
    retry(id) {
      dispatch("retry", { id });
    },
    /** @param {string} id */
    discard(id) {
      dispatch("discard", { id });
    },
    /** @param {string} id */
    toggleReplies(id) {
      expandedReplies = toggled(expandedReplies, id);
    },
    /** @param {string} key */
    toggleEvents(key) {
      expandedEvents = toggled(expandedEvents, key);
    },
  };

  $: config.set({
    user,
    nameOf,
    now: referenceNow,
    locale,
    timeZone,
    texts: t,
    reactions,
    mentionItems,
    draftKey,
    replyLimit,
    eventGroupLimit,
    handlers,
  });

  /** @param {string} id */
  function keyOf(id) {
    for (const row of rows) {
      if (row.item.id === id) return row.key;
      if (row.events.some((event) => event.id === id)) return row.key;
    }
    return id;
  }

  /** @param {string} key */
  function focusRow(key) {
    const article = [...(listRef?.children ?? [])].find(
      (child) =>
        child instanceof HTMLElement && child.dataset.activityKey === key,
    );
    if (!(article instanceof HTMLElement)) return false;
    article.focus();
    return true;
  }

  function handleScroll() {
    if (!ref || height === undefined) return;
    stick = ref.scrollHeight - ref.scrollTop - ref.clientHeight <= 48;
  }

  function toEnd() {
    if (!ref) return;
    if (height === undefined) {
      endRef?.scrollIntoView({ block: "end" });
    } else {
      ref.scrollTop = ref.scrollHeight;
    }
    newCount = 0;
  }

  /**
   * Work out what arrived since the last update: items that others added,
   * which count while the reader is scrolled up, and your own, which scroll
   * to the end.
   * @param {ReadonlyArray<import("./activity-feed.js").ActivityItem>} next
   */
  function noteItems(next) {
    /** @type {import("./activity-feed.js").ActivityItem[]} */
    const incoming = [];
    let own = false;
    const floor = oldestKnown;
    for (const item of next) {
      for (const each of [item, ...(item.replies ?? [])]) {
        const key = itemKey(each);
        if (known.has(key)) continue;
        const time = itemTime(each);
        known.set(key, time);
        if (time < oldestKnown) oldestKnown = time;
        if (!initialized) continue;
        if (each.author.id === user?.id) own = true;
        // Older pages go in above; only newer items are news.
        else if (time >= floor) incoming.push(each);
      }
    }
    if (focusOlder && initialized && oldestKnown < floor) {
      focusOlder = false;
      tick().then(() => rows[0] && focusRow(rows[0].key));
    }
    initialized = true;
    if (!mounted) return;
    if (own || (incoming.length > 0 && atEnd)) {
      tick().then(toEnd);
    } else if (incoming.length > 0) {
      newCount += incoming.length;
    }
    if (incoming.length > 0) announce(incoming);
  }

  /** @param {import("./activity-feed.js").ActivityItem[]} incoming */
  function announce(incoming) {
    const people = [...new Set(incoming.map((item) => item.author.name))];
    const text = t.incoming(incoming.length, people);
    // The same words twice in a row are not announced twice.
    announcement = "";
    tick().then(() => {
      announcement = text;
    });
  }

  $: noteItems(items);

  $: if (atEnd) newCount = 0;

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.key !== "PageDown" && event.key !== "PageUp") return;
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)
      return;
    const target = event.target;
    if (!(target instanceof HTMLElement) || !listRef) return;
    // Text fields keep their own paging.
    if (target.closest("textarea, input, [role=menu], [role=listbox]")) return;
    const articles = [...listRef.children].filter(
      (child) => child instanceof HTMLElement && child.tagName === "ARTICLE",
    );
    const current = articles.findIndex((article) => article.contains(target));
    if (current === -1) return;
    const next = articles[current + (event.key === "PageDown" ? 1 : -1)];
    if (next instanceof HTMLElement) {
      event.preventDefault();
      next.focus();
    }
  }

  function loadOlder() {
    focusOlder = true;
    dispatch("load:older");
  }

  onMount(() => {
    mounted = true;
    const stopObserving = endRef
      ? observeIntersection(endRef, (entry) => {
          atEnd = entry.isIntersecting;
        })
      : () => {};
    const stopMeasuring = ref
      ? observeResize(ref, (entry) => {
          viewportHeight = entry.contentRect.height || viewportHeight;
        })
      : () => {};
    const stopFollowing = listRef
      ? observeResize(listRef, () => {
          if (stick && height !== undefined) toEnd();
        })
      : () => {};
    if (height !== undefined) toEnd();
    return () => {
      stopObserving();
      stopMeasuring();
      stopFollowing();
    };
  });

  // A window needs a scroller of its own to measure against.
  $: windowed = virtual && height !== undefined;
  $: scrollerStyle = height === undefined ? undefined : toCssLength(height);
</script>

<div class:bx--activity-feed={true}>
  <div
    class:bx--visually-hidden={true}
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {announcement}
  </div>

  {#each errors as error (error.id)}
    <InlineNotification
      lowContrast
      kind="error"
      title={t.rollback(error.op)}
      closeButtonDescription={t.dismiss}
      on:close={() => dispatch("dismiss", { id: error.id })}
    />
  {/each}

  <!-- The feed scrolls only when it has a height. Its articles are tab
       stops, so a scrolling region is never out of keyboard reach. -->
  <div
    bind:this={ref}
    class:bx--activity-feed__scroller={true}
    class:bx--activity-feed__scroller--bounded={height !== undefined}
    style:max-height={scrollerStyle}
    on:scroll={handleScroll}
  >
    {#if hasOlder}
      <div class:bx--activity-feed__older={true}>
        <Button
          kind="ghost"
          size="sm"
          disabled={loadingOlder}
          on:click={loadOlder}
          >{loadingOlder ? t.loadingOlder : t.loadOlder}</Button
        >
      </div>
    {/if}

    {#if rows.length === 0 && !loadingOlder}
      <div class:bx--activity-feed__empty={true}>
        <slot name="empty">{t.empty}</slot>
      </div>
    {/if}

    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
      bind:this={listRef}
      role="feed"
      aria-label={labelText}
      aria-busy={loadingOlder ? "true" : "false"}
      {...$$restProps}
      class:bx--activity-feed__list={true}
      class:bx--activity-feed__list--lazy={lazyRows && !windowed}
      hidden={rows.length === 0 ? true : undefined}
      on:keydown={handleKeydown}
    >
      {#if windowed}
        <VirtualList
          items={rows}
          measured
          itemHeight={96}
          spacerTag="div"
          scrollElement={ref}
          containerHeight={viewportHeight}
          overscan={4}
          getKey={(row) => row.key}
        >
          <svelte:fragment let:item={row} let:index>
            <ActivityRow
              {row}
              posinset={index + 1}
              {setsize}
              {editingId}
              {replyingId}
              {deletingId}
              repliesExpanded={expandedReplies.has(row.item.id)}
              eventsExpanded={expandedEvents.has(row.key)}
            />
          </svelte:fragment>
        </VirtualList>
      {:else}
        {#each rows as row, index (row.key)}
          <ActivityRow
            {row}
            posinset={index + 1}
            {setsize}
            {editingId}
            {replyingId}
            {deletingId}
            repliesExpanded={expandedReplies.has(row.item.id)}
            eventsExpanded={expandedEvents.has(row.key)}
          />
        {/each}
      {/if}
    </div>

    <div
      bind:this={endRef}
      class:bx--activity-feed__end={true}
      aria-hidden="true"
    ></div>

    {#if newCount > 0}
      <div class:bx--activity-feed__new={true}>
        <Button size="sm" kind="secondary" on:click={toEnd}
          >{t.newItems(newCount)}</Button
        >
      </div>
    {/if}
  </div>
</div>
