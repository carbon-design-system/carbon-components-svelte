<script context="module">
  /**
   * @param {number} count
   * @returns {string}
   */
  function defaultResultsText(count) {
    return count === 1
      ? "1 suggestion available"
      : `${count} suggestions available`;
  }

  /**
   * @param {ReadonlyArray<{ message: string }>} errors
   * @returns {string}
   */
  function defaultProblemsText(errors) {
    const noun = errors.length === 1 ? "problem" : "problems";
    return `${errors.length} ${noun} in the query: ${errors
      .map((error) => error.message)
      .join("; ")}`;
  }
</script>

<script>
  /**
   * @template [T=string]
   * @typedef {import("./token-query.js").TokenKey} TokenKey
   * @typedef {import("./token-query.js").TokenQuery} TokenQuery
   * @typedef {import("./token-suggest.js").TokenSuggestion} TokenSuggestion
   */

  /**
   * @event {{ value: string; query: TokenQuery }} change - Dispatched as the user edits the text, after `value` and `query` follow it.
   * @event {{ item: TokenSuggestion; value: string }} select - Dispatched when a row of the menu is chosen.
   * @event {string} search - Dispatched on Enter with the text, as `Search` does.
   * @event {null} clear
   * @restProps {input}
   * @slot {{ item: TokenSuggestion; index: number; highlighted: boolean }}
   */

  /**
   * The query text, such as `is:open label:bug "exact phrase"`.
   * @type {string}
   * @bindable writable
   */
  export let value = "";

  /**
   * The keys a query may use: for each, its type and, for an `enum` or a
   * `user`, the values to offer. Without it every `key:value` is accepted as text.
   * @type {ReadonlyArray<TokenKey>}
   */
  export let keys = [];

  /**
   * The parsed `value`: the free `text`, the `terms`, the `filters` and the `errors`.
   * @type {TokenQuery}
   * @bindable readonly
   */
  export let query = parseQuery("");

  /**
   * Past queries, newest first, offered while the field is empty. Choosing
   * one writes it into the field. The list is the `queries` of `SearchRecent`.
   * @type {ReadonlyArray<string>}
   */
  export let recentQueries = [];

  /**
   * Set to `false` to draw no highlight behind the text. The field is then
   * the `Search` it is built on, and the menu opens at the start of the field.
   */
  export let highlight = true;

  /**
   * What `@today` is relative to. Defaults to the current time at each parse.
   * @type {Date | undefined}
   */
  export let now = undefined;

  /**
   * Replace the date shortcuts offered for a `date` key.
   * @type {ReadonlyArray<import("./token-suggest.js").DatePreset> | undefined}
   */
  export let datePresets = undefined;

  /**
   * Most rows in the menu. A longer menu scrolls, which is a scrollable
   * region: raise it only with `menuMaxHeight`.
   */
  export let limit = 8;

  /**
   * Milliseconds to wait after typing before calling a key's `source`.
   */
  export let debounce = 150;

  /**
   * Wait this many milliseconds before showing the loading row.
   * Once shown, it stays for at least 500 ms.
   */
  export let loadingDelay = 300;

  /**
   * Override the menu's max height. Numbers are pixels; strings accept any
   * CSS length. Defaults to 20rem.
   * @type {number | string | undefined}
   */
  export let menuMaxHeight = undefined;

  /**
   * Specify the size of the field. Passed to `Search`.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /** Specify the class name passed to the outer div element of the field */
  export let searchClass = "";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Specify the `placeholder` attribute of the input */
  export let placeholder = "Search...";

  /** Specify the helper text */
  export let helperText = "";

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to disable the field */
  export let disabled = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /**
   * Set to `true` while results are loading. Shows a spinner in the field.
   * Applies to the results of your own search, not to a key's `source`.
   */
  export let loading = false;

  /** Specify a keyboard shortcut that focuses the field, such as `"/"`. */
  export let shortcut = "";

  /** Specify the close button label text */
  export let closeButtonLabelText = "Clear search input";

  /** Specify the text of the row shown when nothing matches */
  export let emptyText = "No results";

  /** Specify the text of the loading row */
  export let loadingText = "Loading...";

  /** Specify the text of the row shown when a source fails */
  export let errorText = "Could not load results";

  /** Specify the heading of the keys, shown when recent queries share the menu */
  export let keysLabel = "Filters";

  /** Specify the heading of the recent queries */
  export let recentLabel = "Recent searches";

  /** Specify the accessible name of the menu */
  export let menuLabel = "Suggestions";

  /**
   * Specify the text announced to screen readers when results arrive.
   * @type {(count: number) => string}
   */
  export let resultsText = defaultResultsText;

  /**
   * Specify the text that describes the problems in the query to screen
   * readers. Called with the errors; not called when there are none.
   * @type {(errors: ReadonlyArray<import("./token-query.js").TokenError>) => string}
   */
  export let problemsText = defaultProblemsText;

  /**
   * Whether the menu is open.
   * @bindable readonly
   */
  export let open = false;

  /** Set an id for the input element */
  export let id = uniqueId();

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  /**
   * Obtain a reference to the menu HTML element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let menuRef = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import ListBoxMenu from "../ListBox/ListBoxMenu.svelte";
  import ListBoxMenuGroup from "../ListBox/ListBoxMenuGroup.svelte";
  import ListBoxMenuItem from "../ListBox/ListBoxMenuItem.svelte";
  import ListBoxMenuStatus from "../ListBox/ListBoxMenuStatus.svelte";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import Search from "../Search/Search.svelte";
  import UserAvatar from "../UserAvatar/UserAvatar.svelte";
  import { toCssLength } from "../utils/css-length.js";
  import { debounce as debounceFn } from "../utils/debounce.js";
  import { createLoadingIndicator } from "../utils/delayed-loading.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { physicalAlign } from "../utils/inline-align.js";
  import { fitIntrinsicAlign } from "../utils/menu-placement.js";
  import { moveIndex } from "../utils/move-index.js";
  import { rafThrottle } from "../utils/raf-throttle.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { createSuggestSource } from "./suggest-source.js";
  import { textRectAt } from "./text-rect.js";
  import { highlightRuns } from "./token-highlight.js";
  import { parseQuery } from "./token-query.js";
  import {
    buildInsertion,
    foldText,
    keyItems,
    recentItems,
    sourceItems,
    suggestContext,
    valueItems,
  } from "./token-suggest.js";

  const dispatch = createEventDispatcher();

  /** @type {import("./token-suggest.js").SuggestContext | null} */
  let session = null;
  /** The context Escape closed, so typing on in it does not reopen. */
  let dismissed = "";
  let focused = false;
  let composing = false;
  let highlightedIndex = -1;
  let keyboardHighlight = true;
  let showLoading = false;
  let announcement = "";
  /** @type {import("./suggest-source.js").SuggestState} */
  let sourceState = { status: "idle", items: [], query: "" };
  /** @type {"start" | "center" | "end"} */
  let align = "start";
  let rtl = false;
  let accepting = false;
  /** Whether the highlight layer sits in the field. */
  let attached = false;
  /** @type {null | string} */
  let requested = null;

  /** @type {null | HTMLDivElement} */
  let backdrop = null;
  /** @type {null | HTMLDivElement} */
  let content = null;
  /** @type {null | HTMLElement} */
  let anchor = null;
  /** @type {() => void} */
  let detach = () => {};

  const source = createSuggestSource((state) => {
    sourceState = state;
    highlightedIndex = -1;
    keyboardHighlight = true;
  });

  const loadingIndicator = createLoadingIndicator((shown) => {
    showLoading = shown;
  });

  const announce = debounceFn(
    /** @param {unknown} text */ (text) => {
      announcement = String(text);
    },
    300,
  );

  $: text = typeof value === "string" ? value : "";
  $: query = parseQuery(text, { keys, now });
  // A qualifier still waiting for its value is not a mistake to underline.
  $: runs = highlightRuns(
    text,
    query.errors.filter((error) => error.code !== "missing-value"),
  );
  $: describedBy = query.errors.length > 0 ? `${id}-problems` : undefined;
  $: problems = query.errors.length > 0 ? problemsText(query.errors) : "";

  $: status = sourceState.status;
  // A menu with one row that says what is already typed has nothing to add.
  $: rows =
    sourceState.items.length === 1 &&
    sourceState.items[0].kind !== "recent" &&
    session &&
    foldText(sourceState.items[0].value) === foldText(session.prefix)
      ? []
      : sourceState.items;
  $: loadingIndicator(status === "loading", loadingDelay);
  $: showEmpty =
    !!emptyText &&
    status === "ready" &&
    rows.length === 0 &&
    !!session &&
    session.prefix !== "" &&
    sourceState.items.length === 0;
  $: showError = status === "error";
  $: open =
    !!session &&
    focused &&
    !composing &&
    (rows.length > 0 ||
      showEmpty ||
      showError ||
      (status === "loading" && showLoading));
  $: menuId = `${id}-menu`;
  $: highlightedId =
    open && highlightedIndex > -1 ? `${id}-option-${highlightedIndex}` : null;
  $: maxHeight = toCssLength(menuMaxHeight) ?? "20rem";
  $: preferredAlign = physicalAlign("start", rtl);
  $: rowSize =
    size === "xl" ? "lg" : size === "xs" || size === "sm" ? "sm" : "md";
  // Keys and recent queries share the menu: name each section.
  $: sections = sectionsOf(rows);
  $: announce(
    open
      ? status === "error"
        ? errorText
        : status === "loading" && rows.length === 0
          ? loadingText
          : rows.length === 0
            ? emptyText
            : resultsText(rows.length)
      : "",
  );

  $: attach(ref, highlight ? backdrop : null);
  $: if (open) fitAlign(rows, preferredAlign);
  // The layer follows the text: line it up again once the new runs are drawn.
  $: if (content && runs) tick().then(syncScroll);

  onMount(() => () => {
    detach();
    source.reset();
    loadingIndicator.cancel();
    announce.cancel();
    place.cancel();
  });

  /**
   * @param {ReadonlyArray<TokenSuggestion>} list
   * @returns {Array<{ label: string | null, start: number, rows: ReadonlyArray<TokenSuggestion> }>}
   */
  function sectionsOf(list) {
    const recents = list.filter((row) => row.kind === "recent");
    if (recents.length === 0 || recents.length === list.length) {
      return [{ label: null, start: 0, rows: list }];
    }
    const others = list.filter((row) => row.kind !== "recent");
    return [
      { label: keysLabel, start: 0, rows: others },
      { label: recentLabel, start: others.length, rows: recents },
    ];
  }

  /** @type {null | HTMLInputElement} */
  let bound = null;
  /** @type {null | HTMLElement} */
  let boundLayer = null;

  // `ref` is a `bind:this` target, so its owner hands it over again on
  // every update. Attach once per element.
  /**
   * @param {null | HTMLInputElement} el
   * @param {null | HTMLElement} layer The highlight layer, or `null` for none.
   */
  function attach(el, layer) {
    if (el === bound && layer === boundLayer) return;
    bound = el;
    boundLayer = layer;
    detach();
    detach = () => {};
    close();
    if (!el || typeof window === "undefined") return;

    focused = el.ownerDocument.activeElement === el;
    const container = el.parentElement;
    const node = document.createElement("span");
    node.className = "bx--token-search__anchor";
    node.setAttribute("aria-hidden", "true");
    container?.appendChild(node);
    anchor = node;

    if (layer && container) {
      container.appendChild(layer);
      attached = true;
    }

    /** @type {Array<[string, EventListener, AddEventListenerOptions | boolean]>} */
    const listeners = [
      ["input", handleInput, false],
      ["keydown", /** @type {EventListener} */ (handleKeydown), true],
      ["keyup", /** @type {EventListener} */ (handleKeyup), false],
      ["click", handleClick, false],
      ["focus", handleFocus, false],
      ["blur", handleBlur, false],
      ["scroll", syncScroll, false],
      ["select", syncScroll, false],
      ["compositionstart", handleCompositionStart, false],
      ["compositionend", handleCompositionEnd, false],
    ];
    for (const [type, fn, options] of listeners) {
      el.addEventListener(type, fn, options);
    }
    const doc = el.ownerDocument;
    doc.addEventListener("selectionchange", syncScroll);

    syncScroll();
    detach = () => {
      for (const [type, fn, options] of listeners) {
        el.removeEventListener(type, fn, options);
      }
      doc.removeEventListener("selectionchange", syncScroll);
      cancelAnimationFrame(frame);
      node.remove();
      anchor = null;
      attached = false;
      placed = "";
    };
  }

  let frame = 0;
  let placed = "";

  // The layer holds the same text as the input and is put where the input
  // puts it. Two rules decide that, and they differ. Text that fits is
  // aligned by the field's direction. Text that overflows is anchored at the
  // start of its own first-strong direction (a Hebrew query in an LTR field
  // runs off to the left), and `scrollLeft` counts from there. Measured on
  // every frame the field has focus, since not every browser fires an event
  // for every change of `scrollLeft`.
  function syncScroll() {
    if (!ref || !content || !backdrop) return;
    const box = backdrop.clientWidth;
    const width = content.getBoundingClientRect().width;
    const scroll = ref.scrollLeft;
    let x;
    if (width <= box) {
      x = getComputedStyle(ref).direction === "rtl" ? box - width : 0;
    } else {
      const textRtl = content.matches(":dir(rtl)");
      x = (textRtl ? box - width : 0) - scroll;
    }
    const next = x ? `translateX(${x}px)` : "";
    if (next !== placed) {
      placed = next;
      content.style.transform = next;
    }
    cancelAnimationFrame(frame);
    if (focused) frame = requestAnimationFrame(syncScroll);
  }

  function close() {
    if (!session) return;
    session = null;
    requested = null;
    source.reset();
    sourceState = { status: "idle", items: [], query: "" };
    highlightedIndex = -1;
  }

  /**
   * Read the caret and open, update or close the menu.
   * @param {boolean} [canOpen=true] Whether a closed menu may open.
   */
  function refresh(canOpen = true) {
    const el = ref;
    if (!el || composing || el.disabled || el.readOnly) {
      close();
      return;
    }
    const caret = el.selectionStart;
    if (caret === null || caret !== el.selectionEnd) {
      close();
      return;
    }

    const next = suggestContext(el.value, caret, keys);
    if (!next) {
      dismissed = "";
      close();
      return;
    }
    const identity = `${next.kind}:${next.start}`;
    if (dismissed && identity !== dismissed) dismissed = "";
    if (identity === dismissed || (!session && !canOpen)) {
      close();
      return;
    }

    const opened = !session || session.start !== next.start;
    session = next;
    if (opened) {
      rtl = getComputedStyle(el).direction === "rtl";
      highlightedIndex = -1;
    }
    place();
    ensureRequest(el.value);
  }

  /** @param {string} current */
  function ensureRequest(current) {
    const context = session;
    if (!context) return;
    const blank = current.trim() === "";
    const signature = `${context.kind}|${context.key ?? ""}|${context.prefix}|${(context.taken ?? []).join("\u0000")}|${context.operator}|${blank}`;
    if (requested === signature) return;
    requested = signature;

    if (context.kind === "key") {
      source.ask(
        {
          id: "keys",
          known: (q) => [
            ...keyItems(keys, q, limit),
            ...(blank ? recentItems(recentQueries, "", 5) : []),
          ],
          limit: limit + 5,
          debounce: 0,
        },
        context.prefix,
      );
      return;
    }

    const def = context.def;
    if (!def) {
      source.ask({ id: "none", known: () => [], limit, debounce: 0 }, "");
      return;
    }
    const taken = context.taken ?? [];
    const load = def.source;
    source.ask(
      {
        id: `value:${def.key}`,
        known: (q) =>
          valueItems(def, q, {
            taken,
            operator: context.operator,
            limit,
            presets: datePresets,
          }),
        load: load
          ? async (q, signal) =>
              sourceItems(await load(q, { signal, key: def.key }), {
                taken,
                limit,
              })
          : undefined,
        limit,
        debounce,
      },
      context.prefix,
    );
  }

  // The menu is anchored where the word under the caret starts, read from
  // the layer that draws the text. A frame later it is read again: a word
  // that was scrolled into view has moved.
  function measure() {
    if (!ref || !anchor || !session) return;
    const container = ref.parentElement;
    if (!container) return;
    const box = container.getBoundingClientRect();
    const found = content ? textRectAt(content, session.start) : null;
    let left = 0;
    if (found) {
      const edge = found.after === rtl ? found.rect.left : found.rect.right;
      left = Math.min(Math.max(edge - box.left, 0), box.width);
    } else if (backdrop && attached) {
      // No text to read: the start of the box the text will fill.
      left = backdrop.offsetLeft + (rtl ? backdrop.offsetWidth : 0);
    } else if (rtl) {
      left = box.width;
    }
    anchor.style.left = `${left}px`;
  }

  const place = rafThrottle(measure);

  let fitFrame = 0;

  /**
   * Keep the menu inside the window sideways.
   * @param {unknown} _rows
   * @param {"start" | "center" | "end"} preferred
   */
  function fitAlign(_rows, preferred) {
    tick().then(() => {
      cancelAnimationFrame(fitFrame);
      fitFrame = requestAnimationFrame(() => {
        if (!open || !menuRef || !anchor) return;
        const a = anchor.getBoundingClientRect();
        const width = menuRef.getBoundingClientRect().width;
        align = fitIntrinsicAlign({
          before: a.left,
          after: a.right,
          size: width,
          max: document.documentElement.clientWidth,
          align: preferred,
        });
      });
    });
  }

  function handleInput() {
    syncScroll();
    tick().then(() => {
      if (ref) dispatch("change", { value: ref.value, query });
    });
    if (accepting || composing) return;
    refresh();
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (composing || isImeComposition(event)) return;

    if (!open) {
      // The menu can be asked for from the keyboard.
      if (event.key === "ArrowDown" && !event.altKey && !event.shiftKey) {
        dismissed = "";
        refresh();
        if (session) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        if (!rows.some((row) => !row.disabled)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        moveHighlight(event.key === "ArrowDown" ? 1 : -1);
        break;
      }
      case "Enter":
      case "Tab": {
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
          return;
        }
        // Nothing is chosen until the arrow keys choose it, so Enter still
        // searches and Tab still leaves.
        if (highlightedIndex < 0) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        accept(highlightedIndex);
        break;
      }
      case "Escape": {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (session) dismissed = `${session.kind}:${session.start}`;
        close();
        break;
      }
    }
  }

  const CARET_KEYS = /^(Arrow(Left|Right)|Home|End)$/;

  /** @param {KeyboardEvent} event */
  function handleKeyup(event) {
    syncScroll();
    if (session && !composing && CARET_KEYS.test(event.key)) refresh(false);
  }

  function handleClick() {
    syncScroll();
    if (session) refresh(false);
    else if (ref && ref.value.trim() === "") refresh();
  }

  function handleFocus() {
    focused = true;
    syncScroll();
    if (ref && ref.value.trim() === "") refresh();
  }

  function handleBlur() {
    focused = false;
    close();
  }

  // The IME's candidate window opens at the caret, where the menu would
  // sit. Nothing is offered or accepted while it is up.
  function handleCompositionStart() {
    composing = true;
  }

  function handleCompositionEnd() {
    composing = false;
    syncScroll();
    refresh();
  }

  /** @param {number} step */
  function moveHighlight(step) {
    let next = highlightedIndex;
    for (let n = 0; n < rows.length; n++) {
      next = moveIndex(next, step, rows.length);
      if (!rows[next].disabled) break;
    }
    keyboardHighlight = true;
    highlightedIndex = next;
  }

  /**
   * Put the full text in a `title` while an option is cut short, so hovering
   * it shows what the ellipsis hides.
   * @param {HTMLElement} row
   */
  function titleWhenCut(row) {
    const cut = [row, ...row.querySelectorAll("*")].some(
      (node) => node.scrollWidth > node.clientWidth,
    );
    if (cut) row.setAttribute("title", row.textContent?.trim() ?? "");
    else row.removeAttribute("title");
  }

  /**
   * @param {number} index
   * @param {MouseEvent} event
   */
  function handleOptionEnter(index, event) {
    if (event.currentTarget instanceof HTMLElement) {
      titleWhenCut(event.currentTarget);
    }
    pointerHighlight(index);
  }

  /** @param {number} index */
  function pointerHighlight(index) {
    if (highlightedIndex === index) return;
    keyboardHighlight = false;
    highlightedIndex = index;
  }

  /**
   * Replace `[start, end)` as typing would, so the browser's undo restores
   * what was there. `execCommand` is deprecated yet is the only way to edit
   * a field and keep its undo stack; where it does nothing, the value is
   * written and an `input` event follows.
   * @param {HTMLInputElement} el
   * @param {number} start
   * @param {number} end
   * @param {string} insert
   */
  function replaceRange(el, start, end, insert) {
    el.setSelectionRange(start, end);
    let done = false;
    try {
      done =
        typeof document.execCommand === "function" &&
        document.execCommand("insertText", false, insert);
    } catch {
      done = false;
    }
    if (done && el.value.slice(start, start + insert.length) === insert) return;

    el.setRangeText(insert, start, end, "end");
    el.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertReplacementText",
        data: insert,
      }),
    );
  }

  /** @param {number} index */
  function accept(index) {
    const el = ref;
    const item = rows[index];
    const context = session;
    if (!el || !context || !item || item.disabled) return;

    const insertion = buildInsertion(el.value, context, item);
    close();
    accepting = true;
    try {
      replaceRange(el, insertion.start, insertion.end, insertion.insert);
    } finally {
      accepting = false;
    }
    el.setSelectionRange(insertion.caret, insertion.caret);
    syncScroll();
    dispatch("select", { item, value: el.value });
    if (insertion.reopen) {
      // A key chosen: its values are what comes next.
      dismissed = "";
      refresh();
    }
  }
</script>

<Search
  bind:value
  bind:ref
  {id}
  {size}
  {labelText}
  {hideLabel}
  {placeholder}
  {helperText}
  {invalid}
  {invalidText}
  {disabled}
  {readonly}
  {loading}
  {shortcut}
  {closeButtonLabelText}
  searchClass="bx--token-search {highlight
    ? 'bx--token-search--highlight'
    : ''} {searchClass}"
  spellcheck="false"
  autocapitalize="off"
  role="combobox"
  tabindex={0}
  aria-autocomplete="list"
  aria-haspopup="listbox"
  aria-expanded={open ? "true" : "false"}
  aria-controls={open ? menuId : undefined}
  aria-activedescendant={highlightedId ?? undefined}
  {...$$restProps}
  aria-describedby={[describedBy, $$restProps["aria-describedby"]]
    .filter(Boolean)
    .join(" ") || undefined}
  on:search
  on:clear
  on:clear={() => {
    tick().then(() => dispatch("change", { value, query }));
  }}
  on:input
  on:focus
  on:blur
  on:paste
/>
<div
  bind:this={backdrop}
  hidden={!attached}
  aria-hidden="true"
  class:bx--token-search__backdrop={true}
>
  <div bind:this={content} dir="auto" class:bx--token-search__content={true}>
    {#each runs as run, i (i)}{#if run.type === "qualifier"}<span
          class:bx--token-search__qualifier={true}
          class:bx--token-search__qualifier--negated={run.negated}
          class:bx--token-search__qualifier--error={run.error}
          >{#each run.parts as part, j (j)}<span
              class:bx--token-search__key={part.kind === "key"}
              class:bx--token-search__value={part.kind === "value"}
              class:bx--token-search__error={part.error}>{part.text}</span
            >{/each}</span
        >{:else if run.type === "phrase"}<span
          class:bx--token-search__phrase={true}
          class:bx--token-search__error={run.error}>{run.text}</span
        >{:else}{run.text}{/if}{/each}
  </div>
</div>
{#if problems}
  <span id="{id}-problems" class:bx--visually-hidden={true}>{problems}</span>
{/if}
<div class:bx--visually-hidden={true} aria-live="polite" aria-atomic="true">
  {announcement}
</div>
{#if anchor}
  <FloatingPortal
    {anchor}
    {open}
    direction="bottom"
    intrinsicWidth
    intrinsicAlign={align}
    gapTop={4}
    gapBottom={4}
  >
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class:bx--token-search__menu={true}
      class:bx--token-search__menu--md={rowSize === "md"}
      class:bx--token-search__menu--lg={rowSize === "lg"}
      on:mousedown|preventDefault
    >
      <ListBoxMenu
        id={menuId}
        aria-label={menuLabel}
        tabindex={-1}
        aria-busy={status === "loading" ? "true" : undefined}
        {highlightedId}
        highlightScroll={keyboardHighlight}
        bind:ref={menuRef}
        style="position: static; max-height: {maxHeight};"
      >
        {#each sections as section, s (s)}
          <ListBoxMenuGroup
            labelledBy={section.label ? `${id}-section-${s}` : undefined}
          >
            {#if section.label}
              <span id="{id}-section-{s}" class:bx--visually-hidden={true}
                >{section.label}</span
              >
              <div
                role="presentation"
                aria-hidden="true"
                class:bx--list-box__menu-group-header={true}
                class:bx--list-box__menu-group-header--first={s === 0}
              >
                {section.label}
              </div>
            {/if}
            {#each section.rows as item, r (r)}
              {@const index = section.start + r}
              <ListBoxMenuItem
                id="{id}-option-{index}"
                disabled={item.disabled}
                on:click={() => accept(index)}
                on:mouseenter={(event) => handleOptionEnter(index, event)}
              >
                <slot {item} {index} highlighted={index === highlightedIndex}>
                  {#if item.kind === "value" && session?.def?.type === "user"}
                    <UserAvatar size="sm" name={item.text} />
                  {/if}
                  <span class:bx--token-search__text={true}>{item.text}</span>
                  {#if item.secondary}
                    <span class:bx--token-search__secondary={true}
                      >{item.secondary}</span
                    >
                  {/if}
                </slot>
              </ListBoxMenuItem>
            {/each}
          </ListBoxMenuGroup>
        {/each}
        {#if status === "loading" && showLoading}
          <ListBoxMenuStatus>{loadingText}</ListBoxMenuStatus>
        {:else if showError}
          <ListBoxMenuStatus>{errorText}</ListBoxMenuStatus>
        {:else if showEmpty}
          <ListBoxMenuStatus>{emptyText}</ListBoxMenuStatus>
        {/if}
      </ListBoxMenu>
    </div>
  </FloatingPortal>
{/if}
