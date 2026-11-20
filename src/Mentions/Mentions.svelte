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
</script>

<script>
  /**
   * @template {MentionItem} [Item=MentionItem]
   */

  /**
   * An option in the menu.
   * @typedef {object} MentionItem
   * @property {string | number} id - Identifies the option and is the id written into a `"token"` mention.
   * @property {string} text - What the option shows, and what is written after the trigger.
   * @property {string} [secondary] - Muted text beside `text`. A sync source also matches the query against it.
   * @property {string} [insertText] - Written instead of `text`. For `"plain"`, the text that replaces the trigger.
   * @property {boolean} [disabled] - Show the option but do not let it be chosen.
   */

  /**
   * Passed to a function source with the query.
   * @typedef {object} MentionSourceContext
   * @property {AbortSignal} signal - Aborts when a newer query replaces this one or the menu closes.
   * @property {string} trigger - The trigger character.
   */

  /**
   * A mention in the field's current text.
   * @typedef {object} Mention
   * @property {string} trigger - The trigger character.
   * @property {string | number} id - The item's `id`. A string when read from a `"token"`.
   * @property {string} text - The item's `text`, without the trigger.
   * @property {number} start - Index of the trigger in the text.
   * @property {number} end - Index after the mention.
   */

  /**
   * One trigger character and where its items come from.
   * @typedef {object} MentionTrigger
   * @property {string} char - The character that starts a mention, such as `@`, `#`, `:` or `/`. One character.
   * @property {ReadonlyArray<MentionItem> | ((query: string, context: MentionSourceContext) => ReadonlyArray<MentionItem> | Promise<ReadonlyArray<MentionItem>>)} items - An array, filtered here, or a function that returns the items for the query, synchronously or as a promise.
   * @property {"text" | "token" | "plain"} [format="text"] - `"text"` writes the trigger and the item's text and records it in `mentions`. `"token"` writes `@[Text](id)`, so the value carries the id. `"plain"` replaces the trigger with the item's text and records nothing.
   * @property {"word-start" | "line-start"} [position="word-start"] - Where the trigger may sit: after a space or opening bracket, or only at the start of a line.
   * @property {boolean} [allowSpaces=false] - Let the query run across spaces, so "@Alice Sm" matches.
   * @property {number} [minQueryLength=0] - Characters to type after the trigger before the menu opens.
   * @property {number} [maxQueryLength=32] - Characters after which the trigger is forgotten.
   * @property {number} [limit=8] - Most options shown. Raise it only with `menuMaxHeight`: a menu that scrolls is a scrollable region.
   * @property {number} [debounce=150] - Milliseconds to wait after typing before calling a function source.
   * @property {string} [suffix=" "] - Written after the mention. Skipped when whitespace follows the caret.
   * @property {string} [label] - Accessible name of the menu.
   * @property {(items: ReadonlyArray<MentionItem>, query: string) => ReadonlyArray<MentionItem>} [filter] - Replaces the ranking of an array source.
   */

  /**
   * @event {{ item: Item; mention: Mention | null; trigger: string }} select
   * @slot {{ item: Item; index: number; trigger: string; query: string; highlighted: boolean }}
   */

  /**
   * The `<textarea>` or `<input>` to complete in.
   * Pass the `ref` of a `TextArea` or `TextInput`.
   * @type {null | HTMLTextAreaElement | HTMLInputElement}
   */
  export let field = null;

  /**
   * The triggers to complete, each with its own items.
   * @type {ReadonlyArray<MentionTrigger>}
   */
  export let triggers = [];

  /**
   * The field's value. Optional: typing needs no help. Pass it when the
   * app changes the value from code, so `mentions` follows the edit.
   * @type {string | undefined}
   */
  export let value = undefined;

  /**
   * The mentions in the field, in order: those written as `"text"` that
   * the text still holds, and those read from `"token"` syntax.
   * @type {Mention[]}
   * @bindable readonly
   */
  export let mentions = [];

  /**
   * Whether the menu is open.
   * @bindable readonly
   */
  export let open = false;

  /**
   * Specify the size of the options.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "sm";

  /**
   * Override the menu's max height. Numbers are pixels; strings accept any
   * CSS length. Defaults to 20rem, taller than the default eight options, so the menu does not scroll.
   * @type {number | string | undefined}
   */
  export let menuMaxHeight = undefined;

  /**
   * Wait this many milliseconds before showing the loading row.
   * Once shown, it stays for at least 500 ms.
   */
  export let loadingDelay = 300;

  /**
   * Specify the text of the row shown when nothing matches a query.
   * Set to `""` to show no row.
   */
  export let emptyText = "No results";

  /** Specify the text of the loading row */
  export let loadingText = "Loading...";

  /** Specify the text of the row shown when a source fails */
  export let errorText = "Could not load results";

  /**
   * Specify the text announced to screen readers when results arrive.
   * @type {(count: number, trigger: string) => string}
   */
  export let resultsText = defaultResultsText;

  /** Set an id for the menu */
  export let id = uniqueId();

  /**
   * Obtain a reference to the menu HTML element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let menuRef = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import ListBoxMenu from "../ListBox/ListBoxMenu.svelte";
  import ListBoxMenuItem from "../ListBox/ListBoxMenuItem.svelte";
  import ListBoxMenuStatus from "../ListBox/ListBoxMenuStatus.svelte";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import { toCssLength } from "../utils/css-length.js";
  import { debounce } from "../utils/debounce.js";
  import { deepEqual } from "../utils/deep-equal.js";
  import { createLoadingIndicator } from "../utils/delayed-loading.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { physicalAlign } from "../utils/inline-align.js";
  import { fitIntrinsicAlign } from "../utils/menu-placement.js";
  import { moveIndex } from "../utils/move-index.js";
  import { rafThrottle } from "../utils/raf-throttle.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { disposeCaretMirror, getCaretCoordinates } from "./caret-position.js";
  import { detectMention } from "./detect-mention.js";
  import { createMentionSource } from "./mention-source.js";
  import {
    buildInsertion,
    parseMentionTokens,
    reconcileMentions,
    spliceFromValues,
  } from "./mention-tokens.js";

  const dispatch = createEventDispatcher();

  /**
   * What the live region says: the result count, or why there is none.
   * @param {boolean} isOpen
   * @param {string} state
   * @param {number} count
   * @param {string} char
   * @param {{ errorText: string, loadingText: string, emptyText: string, resultsText: (count: number, trigger: string) => string }} texts
   */
  function announcementFor(isOpen, state, count, char, texts) {
    if (!isOpen) return "";
    if (state === "error") return texts.errorText;
    if (state === "loading") return texts.loadingText;
    return count === 0 ? texts.emptyText : texts.resultsText(count, char);
  }

  /** @param {MentionTrigger} trigger */
  function normalize(trigger) {
    return {
      char: trigger.char,
      items: trigger.items ?? [],
      format: trigger.format ?? "text",
      position: trigger.position ?? "word-start",
      allowSpaces: trigger.allowSpaces === true,
      minQueryLength: trigger.minQueryLength ?? 0,
      maxQueryLength: trigger.maxQueryLength ?? 32,
      limit: trigger.limit ?? 8,
      debounce: trigger.debounce ?? 150,
      suffix: trigger.suffix ?? " ",
      label: trigger.label,
      filter: trigger.filter,
    };
  }

  /** @type {null | { index: number; char: string; query: string; start: number; end: number }} */
  let session = null;
  /** Trigger index that Escape closed, so typing on in it does not reopen. */
  let dismissedStart = -1;
  let focused = false;
  let composing = false;
  let highlightedIndex = -1;
  let keyboardHighlight = true;
  let showLoading = false;
  let announcement = "";
  /** @type {import("./mention-source.js").MentionSourceState} */
  let sourceState = { status: "idle", items: [], query: "" };
  /** @type {"start" | "center" | "end"} */
  let align = "start";
  /** @type {boolean} */
  let rtl = false;

  /** @type {null | HTMLElement} */
  let anchor = null;
  /** @type {null | { top: number; left: number; height: number }} */
  let coordinates = null;
  /**
   * What the last request was for, so a repeated state asks nothing.
   * @type {null | { char: string; query: string; items: unknown; filter: unknown }}
   */
  let requested = null;
  let prevValue = "";
  /** @type {Mention[]} */
  let tracked = [];
  let accepting = false;
  /** @type {() => void} */
  let detach = () => {};

  const source = createMentionSource((state) => {
    sourceState = state;
    highlightedIndex = state.items.findIndex((item) => !item.disabled);
    keyboardHighlight = true;
  });

  const loadingIndicator = createLoadingIndicator((shown) => {
    showLoading = shown;
  });

  const announce = debounce(
    /** @param {unknown} text */ (text) => {
      announcement = String(text);
    },
    300,
  );

  $: rules = triggers.map(normalize);
  $: tokenChars = rules.filter((r) => r.format === "token").map((r) => r.char);
  $: items = sourceState.items;
  $: status = sourceState.status;
  $: loadingIndicator(status === "loading", loadingDelay);
  $: showEmpty =
    !!emptyText &&
    status === "ready" &&
    items.length === 0 &&
    !!session &&
    session.query !== "";
  $: showError = status === "error";
  $: open =
    !!session &&
    focused &&
    !composing &&
    (items.length > 0 ||
      showEmpty ||
      showError ||
      (status === "loading" && showLoading));
  $: menuId = `menu-${id}`;
  $: highlightedId =
    open && highlightedIndex > -1 ? `${id}-option-${highlightedIndex}` : null;
  $: activeRule = session ? rules[session.index] : undefined;
  $: menuLabel = activeRule?.label || "Suggestions";
  $: maxHeight = toCssLength(menuMaxHeight) ?? "20rem";
  $: preferredAlign = physicalAlign("start", rtl);

  $: announce(
    announcementFor(open, status, items.length, session?.char ?? "", {
      errorText,
      loadingText,
      emptyText,
      resultsText,
    }),
  );

  $: bind(field);
  $: syncValue(value);
  $: syncAria(field, open, highlightedId, menuId);
  $: syncTokens(field, tokenChars);
  $: if (session) ensureRequest(rules);
  $: if (open) fitAlign(items, preferredAlign);

  onMount(() => () => {
    detach();
    source.reset();
    loadingIndicator.cancel();
    announce.cancel();
    place.cancel();
  });

  /** @type {null | HTMLTextAreaElement | HTMLInputElement} */
  let bound = null;

  // `field` is a `bind:this` target, so its owner hands it over again on
  // every update. Attach once per element, not once per hand-over.
  /** @param {null | HTMLTextAreaElement | HTMLInputElement} el */
  function bind(el) {
    if (el === bound) return;
    bound = el;
    detach();
    detach = () => {};
    close();
    if (!el || typeof window === "undefined") return;

    prevValue = el.value;
    tracked = [];
    focused = el.ownerDocument.activeElement === el;

    const container =
      /** @type {HTMLElement | null} */ (el.offsetParent) ?? el.parentElement;
    const node = document.createElement("span");
    node.className = "bx--mentions__anchor";
    node.setAttribute("aria-hidden", "true");
    container?.appendChild(node);
    anchor = node;

    /** @type {Array<[string, EventListener, AddEventListenerOptions | boolean]>} */
    const listeners = [
      ["input", handleInput, false],
      [
        "keydown",
        /** @type {EventListener} */ (/** @type {unknown} */ (handleKeydown)),
        true,
      ],
      [
        "keyup",
        /** @type {EventListener} */ (/** @type {unknown} */ (handleKeyup)),
        false,
      ],
      ["click", handleClick, false],
      ["focus", handleFocus, false],
      ["blur", handleBlur, false],
      ["scroll", handleScroll, false],
      ["compositionstart", handleCompositionStart, false],
      ["compositionend", handleCompositionEnd, false],
    ];
    for (const [type, fn, options] of listeners) {
      el.addEventListener(type, fn, options);
    }
    const stopResize = observeResize(el, () => {
      if (session) place();
    });

    detach = () => {
      for (const [type, fn, options] of listeners) {
        el.removeEventListener(type, fn, options);
      }
      stopResize();
      disposeCaretMirror(el);
      node.remove();
      anchor = null;
      for (const name of ARIA_NAMES) el.removeAttribute(name);
    };
  }

  const CARET_KEYS = /^(Arrow(Left|Right)|Home|End|Page(Up|Down))$/;

  const ARIA_NAMES = [
    "aria-autocomplete",
    "aria-haspopup",
    "aria-controls",
    "aria-activedescendant",
  ];

  /**
   * The field stays a textbox. ARIA 1.2 allows `aria-autocomplete`,
   * `aria-controls` and `aria-activedescendant` on one. It does not allow
   * `aria-expanded` on a textbox or `role="combobox"` on a `<textarea>`,
   * and axe reports both, so the live region carries the open state.
   * @param {null | HTMLTextAreaElement | HTMLInputElement} el
   * @param {boolean} isOpen
   * @param {string | null} activeId
   * @param {string} controls
   */
  function syncAria(el, isOpen, activeId, controls) {
    if (!el) return;
    el.setAttribute("aria-autocomplete", "list");
    el.setAttribute("aria-haspopup", "listbox");
    if (isOpen) el.setAttribute("aria-controls", controls);
    else el.removeAttribute("aria-controls");
    if (isOpen && activeId) el.setAttribute("aria-activedescendant", activeId);
    else el.removeAttribute("aria-activedescendant");
  }

  function close() {
    if (!session) return;
    session = null;
    requested = null;
    coordinates = null;
    if (field) disposeCaretMirror(field);
    source.reset();
    sourceState = { status: "idle", items: [], query: "" };
    highlightedIndex = -1;
  }

  /**
   * Read the caret and open, update or close the mention.
   * @param {boolean} [canOpen=true] Whether a new mention may start. Moving the
   *   caret updates one that is open; only typing starts one.
   */
  function refresh(canOpen = true) {
    const el = field;
    if (!el || composing || el.disabled || el.readOnly) {
      close();
      return;
    }
    const caret = el.selectionStart;
    if (caret === null || caret !== el.selectionEnd) {
      close();
      return;
    }

    const match = detectMention(el.value, caret, rules);
    if (!match) {
      dismissedStart = -1;
      close();
      return;
    }
    if (match.start === dismissedStart) {
      close();
      return;
    }
    const opened = session === null || session.start !== match.start;
    if (opened && !canOpen) {
      close();
      return;
    }

    session = match;
    if (opened) {
      rtl = getComputedStyle(el).direction === "rtl";
      place.cancel();
      measure();
    } else {
      place();
    }
    ensureRequest(rules);
  }

  /** @param {typeof rules} current */
  function ensureRequest(current) {
    if (!session) return;
    const rule = current[session.index];
    if (!rule) return;
    if (
      requested &&
      requested.char === session.char &&
      requested.query === session.query &&
      requested.items === rule.items &&
      requested.filter === rule.filter
    ) {
      return;
    }
    requested = {
      char: session.char,
      query: session.query,
      items: rule.items,
      filter: rule.filter,
    };
    source.request(rule, session.query);
  }

  // The mirror is read once when a mention opens and again, a frame later,
  // as the query grows: a word that no longer fits wraps and takes its
  // trigger with it.
  function measure() {
    if (!field || !session) return;
    coordinates = getCaretCoordinates(field, session.start);
    move();
  }

  const place = rafThrottle(measure);

  function move() {
    if (!field || !anchor || !coordinates) return;
    const top =
      field.offsetTop +
      Math.min(
        Math.max(coordinates.top - field.scrollTop, 0),
        Math.max(field.clientHeight - coordinates.height, 0),
      );
    anchor.style.top = `${top}px`;
    anchor.style.left = `${field.offsetLeft + coordinates.left - field.scrollLeft}px`;
    anchor.style.height = `${coordinates.height}px`;
  }

  let fitFrame = 0;

  /**
   * Keep the menu inside the window sideways: the alignment that runs past
   * the edge least, as the menus of `MenuButton` and `Dropdown` choose.
   * @param {unknown} _items
   * @param {"start" | "center" | "end"} preferred
   */
  function fitAlign(_items, preferred) {
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

  /** Reconcile `tracked` with the new text and publish `mentions`. */
  function syncText() {
    if (!field) return;
    const next = field.value;
    if (next !== prevValue) {
      tracked = reconcileMentions(
        tracked,
        spliceFromValues(prevValue, next, field.selectionStart ?? undefined),
      );
      prevValue = next;
    }
    publish();
  }

  function publish() {
    const parsed = tokenChars.length
      ? parseMentionTokens(prevValue, tokenChars)
      : [];
    const next = [...tracked, ...parsed].sort((a, b) => a.start - b.start);
    if (!deepEqual(next, mentions)) mentions = next;
  }

  /**
   * @param {unknown} el
   * @param {ReadonlyArray<string>} _chars
   */
  function syncTokens(el, _chars) {
    if (el) publish();
  }

  /** @param {string | undefined} next */
  function syncValue(next) {
    if (next === undefined || next === prevValue || !field) return;
    tracked = next
      ? reconcileMentions(tracked, spliceFromValues(prevValue, next))
      : [];
    prevValue = next;
    publish();
  }

  /** @param {Event} event */
  function handleInput(event) {
    syncText();
    if (
      accepting ||
      composing ||
      /** @type {InputEvent} */ (event).isComposing
    ) {
      return;
    }
    refresh();
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (!open || composing || isImeComposition(event)) return;

    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        if (!items.some((item) => !item.disabled)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        highlight(event.key === "ArrowDown" ? 1 : -1);
        break;
      }
      case "Enter":
      case "Tab": {
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
          return;
        }
        if (highlightedIndex < 0) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        accept(highlightedIndex);
        break;
      }
      case "Escape": {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (session) dismissedStart = session.start;
        close();
        break;
      }
    }
  }

  /** @param {KeyboardEvent} event */
  function handleKeyup(event) {
    if (session && !composing && CARET_KEYS.test(event.key)) {
      refresh(false);
    }
  }

  function handleClick() {
    if (session) refresh(false);
  }

  function handleFocus() {
    focused = true;
  }

  function handleBlur() {
    focused = false;
    close();
  }

  function handleScroll() {
    if (session) move();
  }

  // The IME's candidate window opens at the caret, where the menu would
  // sit. Nothing is detected or accepted while it is up.
  function handleCompositionStart() {
    composing = true;
  }

  function handleCompositionEnd() {
    composing = false;
    syncText();
    refresh();
  }

  /** @param {number} step */
  function highlight(step) {
    let next = highlightedIndex;
    for (let n = 0; n < items.length; n++) {
      next = moveIndex(next, step, items.length);
      if (!items[next].disabled) break;
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
   * the trigger and the query. `execCommand` is deprecated yet is the only
   * way to edit a field and keep its undo stack; where it does nothing,
   * the value is written and an `input` event follows.
   * @param {HTMLTextAreaElement | HTMLInputElement} el
   * @param {number} start
   * @param {number} end
   * @param {string} text
   */
  function replaceRange(el, start, end, text) {
    el.setSelectionRange(start, end);
    let done = false;
    try {
      done =
        typeof document.execCommand === "function" &&
        document.execCommand("insertText", false, text);
    } catch {
      done = false;
    }
    if (done && el.value.slice(start, start + text.length) === text) return;

    el.setRangeText(text, start, end, "end");
    el.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertReplacementText",
        data: text,
      }),
    );
  }

  /** @param {number} index */
  function accept(index) {
    const el = field;
    const item = items[index];
    if (!el || !session || !item || item.disabled) return;

    const rule = rules[session.index];
    const { start, end } = session;
    const insertion = buildInsertion({
      char: rule.char,
      format: rule.format,
      item,
      start,
      suffix: rule.suffix,
      following: el.value.slice(end),
    });

    close();
    accepting = true;
    try {
      replaceRange(el, start, end, insertion.insert);
    } finally {
      accepting = false;
    }
    el.setSelectionRange(insertion.caret, insertion.caret);

    if (insertion.mention && rule.format === "text") {
      tracked = [...tracked, insertion.mention];
      publish();
    }
    dispatch("select", {
      item,
      mention: insertion.mention,
      trigger: rule.char,
    });
  }
</script>

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
      class:bx--mentions__menu={true}
      class:bx--mentions__menu--md={size === "md"}
      class:bx--mentions__menu--lg={size === "lg"}
      on:mousedown|preventDefault
    >
      <ListBoxMenu
        {id}
        aria-label={menuLabel}
        tabindex={-1}
        aria-busy={status === "loading" ? "true" : undefined}
        {highlightedId}
        highlightScroll={keyboardHighlight}
        bind:ref={menuRef}
        style="position: static; max-height: {maxHeight};"
      >
        {#each items as item, index (index)}
          <ListBoxMenuItem
            id="{id}-option-{index}"
            disabled={item.disabled}
            on:click={() => accept(index)}
            on:mouseenter={(event) => handleOptionEnter(index, event)}
          >
            <slot
              {item}
              {index}
              trigger={session?.char ?? ""}
              query={session?.query ?? ""}
              highlighted={index === highlightedIndex}
            >
              <span class:bx--mentions__text={true}>{item.text}</span>
              {#if item.secondary}
                <span class:bx--mentions__secondary={true}
                  >{item.secondary}</span
                >
              {/if}
            </slot>
          </ListBoxMenuItem>
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
