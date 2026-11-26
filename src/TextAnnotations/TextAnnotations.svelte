<script context="module">
  /**
   * @typedef {object} TextAnnotationAuthor
   * @property {string} [id]
   * @property {string} name
   */

  /**
   * @typedef {object} TextAnnotationComment
   * @property {string} id
   * @property {TextAnnotationAuthor} author
   * @property {string} body
   * @property {string | number | Date} [createdAt]
   */

  /**
   * @typedef {object} TextAnnotation
   * @property {string} id
   * @property {{ start: number, end: number }} range Offsets into the text of the document: its text nodes in order.
   * @property {string} quote The text the range covered when the annotation was made. Used to find it again if the text changes.
   * @property {string} [prefix] The text just before the quote.
   * @property {string} [suffix] The text just after the quote.
   * @property {TextAnnotationComment[]} comments
   */

  /**
   * @typedef {object} TextAnnotationReanchor
   * @property {string} id
   * @property {{ start: number, end: number }} range Where the annotation is in the text now.
   * @property {"exact" | "moved" | "fuzzy" | "orphaned"} status
   */
</script>

<script>
  /**
   * @restProps {div}
   * @event {{ annotation: TextAnnotation }} create - Dispatched before a new annotation is added. Call `preventDefault()` to add it yourself, for example after saving it.
   * @event {{ annotation: TextAnnotation, comment: TextAnnotationComment }} reply - Dispatched before a comment is added to an annotation. `annotation` holds the comment already. Call `preventDefault()` to add it yourself.
   * @event {{ annotation: TextAnnotation }} remove - Dispatched before an annotation is deleted. Call `preventDefault()` to keep it.
   * @event {{ changes: TextAnnotationReanchor[] }} reanchor - Dispatched when the text changes and annotations are found at other offsets, or lost. Store the new `range` of each.
   * @slot {{}} - The read-only text. Leave it out and set `text` for plain text.
   */

  /**
   * Specify the annotations. Each holds the offsets of its range and the
   * text it covered. The offsets count the text nodes of the document in
   * order, so markup inside it does not change them.
   * @type {TextAnnotation[]}
   */
  export let annotations = [];

  /**
   * Specify the annotation that is selected: its text is highlighted more
   * strongly and its card in the rail stands out.
   * @type {string | null}
   */
  export let activeId = null;

  /**
   * Specify the document as plain text, kept as written (line breaks stay).
   * Use the default slot for markup.
   * @type {string | undefined}
   */
  export let text = undefined;

  /**
   * Specify the name of the document, read as the name of its region.
   * @type {string}
   */
  export let labelText = "";

  /**
   * Specify who writes new comments.
   * @type {TextAnnotationAuthor}
   */
  export let user = { name: "You" };

  /**
   * Specify how annotated text is painted. `"auto"` uses the CSS Custom
   * Highlight API where the browser has it and `<mark>` elements elsewhere.
   * `"mark"` wraps text in `<mark>`, which changes the document's DOM: its
   * content must not change except through `text`.
   * @type {"auto" | "highlight-api" | "mark"}
   */
  export let highlight = "auto";

  /** Set to `true` to read annotations without adding any. */
  export let readonly = false;

  /** Set to `false` to hide the margin rail of comments. */
  export let rail = true;

  /**
   * Specify the height of the document and rail, which then scroll together.
   * Leave it unset to let the page scroll.
   * @type {string | number | undefined}
   */
  export let height = undefined;

  /**
   * Specify the shortcut that comments on the selected text.
   * @type {string}
   */
  export let shortcut = "mod+alt+m";

  /**
   * Specify the id the parts derive theirs from.
   * @type {string | undefined}
   */
  export let id = undefined;

  /** Specify the label of the button that appears beside selected text. */
  export let commentText = "Comment";

  /** Specify the label of the button that adds a comment. */
  export let submitText = "Comment";

  export let cancelText = "Cancel";
  export let removeText = "Delete thread";
  export let closeIconDescription = "Close";

  /** Specify the label of the field that starts a thread. */
  export let newCommentLabelText = "Add a comment";

  /** Specify the label of the field that replies to a thread. */
  export let replyLabelText = "Reply";

  /** Specify the name of the list of annotations. */
  export let railLabelText = "Annotations";

  /** Specify what the rail says when there are no annotations. */
  export let emptyText = "No comments yet. Select text to add one.";

  /** Specify what a card says when its text is no longer in the document. */
  export let orphanedText = "The text changed";

  /** Specify the name of the list of other annotations on the same text. */
  export let alsoText = "Also on this text";

  /** Specify what is announced when a thread is added. */
  export let createdText = "Comment added";

  /** Specify what is announced when a thread is deleted. */
  export let removedText = "Thread deleted";

  /**
   * Specify how to reach the annotations without a pointer. It is read
   * with the name of the document.
   */
  export let helpText =
    "Select text with Shift and the arrow keys, then comment on it. Alt and the up or down arrow move between annotations.";

  /**
   * Specify the name of an annotation: its author and the text it is about.
   * @type {(annotation: TextAnnotation, excerpt: string) => string}
   */
  export let annotationDescription = defaultAnnotationDescription;

  /**
   * Specify how replies are counted.
   * @type {(count: number) => string}
   */
  export let repliesText = defaultRepliesText;

  /**
   * Obtain a reference to the element that holds the document.
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import Layer from "../Layer/Layer.svelte";
  import {
    TEXT_ANNOTATION_CLOSE_DELAY_MS,
    TEXT_ANNOTATION_OPEN_DELAY_MS,
  } from "../constants/timing.js";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { toCssLength } from "../utils/css-length.js";
  import { dismiss } from "../utils/dismiss.js";
  import { createFrameJob } from "../utils/frame-batch.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import { rafThrottle } from "../utils/raf-throttle.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { addPooledListener } from "../utils/window-listener-pool.js";
  import AnnotationThread from "./AnnotationThread.svelte";
  import { createAnchor, locateAnchor } from "./anchor.js";
  import {
    createHighlightLayer,
    supportsHighlightApi,
  } from "./highlight-layer.js";
  import { layoutRail } from "./rail-layout.js";
  import { computeSegments } from "./segments.js";
  import {
    buildTextIndex,
    offsetOfPoint,
    offsetsFromRange,
    rangeFromOffsets,
    trimOffsets,
  } from "./text-index.js";

  /**
   * @param {TextAnnotation} annotation
   * @param {string} excerpt
   */
  function defaultAnnotationDescription(annotation, excerpt) {
    const author = annotation.comments[0]?.author.name;
    return author
      ? `Comment by ${author} on “${excerpt}”`
      : `Comment on “${excerpt}”`;
  }

  /** @param {number} count */
  function defaultRepliesText(count) {
    return count === 1 ? "1 reply" : `${count} replies`;
  }

  const dispatch = createEventDispatcher();
  const fallbackId = uniqueId();
  const SELECTION_PAD = 4;
  const EXCERPT_LENGTH = 80;
  /** The mutations that mean the text may have changed. */
  const OBSERVE = { childList: true, characterData: true, subtree: true };

  $: baseId = id ?? fallbackId;

  // Naming and description belong on the region that holds the text.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: rootProps,
  } = splitAriaNaming($$restProps));
  $: describedBy = ariaDescribedBy
    ? `${baseId}-help ${ariaDescribedBy}`
    : `${baseId}-help`;

  let mounted = false;
  /** @type {null | HTMLDivElement} */
  let frameRef = null;
  /** @type {null | HTMLDivElement} */
  let columnRef = null;
  /** @type {null | HTMLElement} */
  let railRef = null;
  /** @type {null | HTMLDivElement} */
  let cardRef = null;
  /** @type {null | HTMLTextAreaElement} */
  let composerRef = null;
  /** @type {null | import("./highlight-layer.js").HighlightLayer} */
  let layer = null;
  /** @type {null | import("./text-index.js").TextIndex} */
  let index = null;
  /** @type {null | MutationObserver} */
  let observer = null;
  let dirty = true;
  /** @type {Record<string, import("./anchor.js").AnchorResult>} */
  let resolved = {};
  /** @type {Record<string, string>} */
  const reported = {};

  /** @type {string | null} */
  let hoverId = null;
  /** @type {string | null} */
  let cardId = null;
  let pinned = false;
  /** @type {string[]} */
  let alsoIds = [];
  /** @type {null | Required<import("./anchor.js").TextAnchor>} */
  let draft = null;
  /** @type {null | { start: number, end: number, left: number, top: number }} */
  let selection = null;
  /** @type {null | { start: number, end: number }} */
  let revealed = null;
  let pointerDown = false;
  /** Where the card goes back to when it closes. */
  /** @type {null | HTMLElement} */
  let returnTo = null;
  let status = "";
  /** @type {Record<string, number>} */
  let tops = {};
  let railHeight = 0;
  let positioned = false;
  /** @type {null | { left: number, top: number }} */
  let cardPlace = null;
  /** The card is hidden until it is placed, and a hidden element can't take focus. */
  /** @type {null | "card" | "composer"} */
  let focusPending = null;
  let railIndex = 0;
  /** The pointer, when a card follows it. */
  /** @type {null | { x: number, y: number }} */
  let cardPointer = null;

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let openTimer;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let closeTimer;

  $: paintedId = hoverId ?? activeId;
  $: ordered = orderAnnotations(annotations, resolved);
  $: if (railIndex > ordered.length - 1)
    railIndex = Math.max(0, ordered.length - 1);
  $: cardAnnotation = cardId
    ? (annotations.find((annotation) => annotation.id === cardId) ?? null)
    : null;
  $: cardOpen = Boolean(draft) || Boolean(cardAnnotation);
  $: ownsCard = cardAnnotation ? isAuthor(cardAnnotation, user) : false;
  $: cardLabel = draft
    ? newCommentLabelText
    : cardAnnotation
      ? annotationDescription(cardAnnotation, excerpt(cardAnnotation.quote))
      : "";
  $: also = alsoIds
    .filter((other) => other !== cardId)
    .map((other) => annotations.find((annotation) => annotation.id === other))
    .filter((annotation) => annotation !== undefined);
  $: frameStyleHeight = toCssLength(height);

  // Annotations, the technique and the text are inputs to a refresh. The
  // refresh itself runs once the DOM has them.
  $: if (mounted) {
    void annotations;
    queueRefresh();
  }
  $: if (mounted) {
    void highlight;
    useLayer();
  }
  $: if (mounted) {
    void paintedId;
    void draft;
    repaint();
  }
  let previousText = text;
  $: if (text !== previousText) {
    previousText = text;
    // The layer put nodes into the old text; they go back before it changes.
    quiet(() => layer?.unwrap());
    dirty = true;
    if (mounted) queueRefresh();
  }
  $: if (mounted) {
    void cardOpen;
    void cardId;
    void draft;
    placeCardJob.schedule();
  }

  /**
   * Whether the user wrote the first comment of an annotation: the one who
   * may delete it.
   * @param {TextAnnotation} annotation
   * @param {TextAnnotationAuthor} author
   */
  function isAuthor(annotation, author) {
    const first = annotation.comments[0]?.author;
    if (!first) return true;
    return first.id !== undefined && author.id !== undefined
      ? first.id === author.id
      : first.name === author.name;
  }

  /**
   * @param {string} quote
   * @returns {string}
   */
  function excerpt(quote) {
    const flat = quote.replace(/\s+/g, " ").trim();
    if (flat.length <= EXCERPT_LENGTH) return flat;
    let cut = EXCERPT_LENGTH;
    // Never cut between the halves of a surrogate pair.
    const code = flat.charCodeAt(cut - 1);
    if (code >= 0xd800 && code <= 0xdbff) cut--;
    return `${flat.slice(0, cut).trimEnd()}…`;
  }

  /**
   * Document order, with annotations whose text is gone last.
   * @param {TextAnnotation[]} list
   * @param {Record<string, import("./anchor.js").AnchorResult>} places
   */
  function orderAnnotations(list, places) {
    return list
      .map((annotation, order) => {
        const place = places[annotation.id];
        const orphaned = place?.status === "orphaned";
        return {
          annotation,
          order,
          start: orphaned
            ? Number.POSITIVE_INFINITY
            : (place?.start ?? annotation.range.start),
        };
      })
      .sort((a, b) => a.start - b.start || a.order - b.order)
      .map(({ annotation }) => annotation);
  }

  /**
   * Run a change to the document without the observer taking it for an edit.
   * @param {() => void} change
   */
  function quiet(change) {
    if (observer && ref) {
      if (observer.takeRecords().length) dirty = true;
      observer.disconnect();
      try {
        change();
      } finally {
        observer.observe(ref, OBSERVE);
      }
    } else {
      change();
    }
  }

  /** Find the annotations in the text as it is now, then paint them. */
  function refresh() {
    if (!ref || !layer) return;
    if (observer?.takeRecords().length) dirty = true;
    if (dirty || !index) {
      quiet(() => layer?.unwrap());
      index = buildTextIndex(ref);
      dirty = false;
    }
    const { text: current } = index;
    /** @type {Record<string, import("./anchor.js").AnchorResult>} */
    const next = {};
    /** @type {TextAnnotationReanchor[]} */
    const changes = [];
    for (const annotation of annotations) {
      const place = locateAnchor(current, annotation);
      next[annotation.id] = place;
      const key = `${place.start}:${place.end}:${place.status}`;
      const own = `${annotation.range.start}:${annotation.range.end}:exact`;
      if (key !== own && reported[annotation.id] !== key) {
        reported[annotation.id] = key;
        changes.push({
          id: annotation.id,
          range: { start: place.start, end: place.end },
          status: place.status,
        });
      } else if (key === own) {
        delete reported[annotation.id];
      }
    }
    resolved = next;
    repaint();
    if (changes.length) dispatch("reanchor", { changes });
  }

  const queueRefresh = rafThrottle(refresh);

  /** Bring the index and the places up to date now, before a read that needs them. */
  function ensureFresh() {
    if (observer?.takeRecords().length) dirty = true;
    if (!index || dirty) refresh();
  }

  /** Paint the segments again, for a change of look or place. */
  function repaint() {
    if (!ref || !layer || !index) return;
    if (observer?.takeRecords().length) {
      dirty = true;
      queueRefresh();
      return;
    }
    const spans = [];
    for (const annotation of annotations) {
      const place = resolved[annotation.id];
      if (place && place.status !== "orphaned") {
        spans.push({ id: annotation.id, start: place.start, end: place.end });
      }
    }
    const segments = computeSegments(spans, {
      activeId: paintedId,
      draft: draft ? draft.range : null,
    });
    const current = index;
    quiet(() => {
      if (layer?.paint(current, segments) && layer.rewrites && ref) {
        index = buildTextIndex(ref);
      }
    });
    measureJob.schedule();
  }

  function useLayer() {
    layer?.destroy();
    const technique =
      highlight === "mark" || !supportsHighlightApi()
        ? "mark"
        : "highlight-api";
    layer = createHighlightLayer(technique);
    dirty = true;
    queueRefresh();
  }

  /**
   * The first line box of a range.
   * @param {Range} range
   */
  function firstRect(range) {
    let first = null;
    for (const rect of range.getClientRects()) {
      // WebKit lists the boxes of selected elements too, in no set order.
      if (rect.width > 0 && (!first || rect.top < first.top)) first = rect;
    }
    return first ?? range.getBoundingClientRect();
  }

  // The margin rail: each card at the top of its text, pushed down to clear
  // the one above. All reads, then the write, one layout in between.
  const measureJob = createFrameJob([
    () => {
      if (!ref || !index || !railRef || !rail) return null;
      const current = index;
      const origin = railRef.getBoundingClientRect().top;
      const bottom = ref.getBoundingClientRect().bottom - origin;
      /** @type {Record<string, number>} */
      const heights = {};
      for (const element of railRef.querySelectorAll("[data-annotation-id]")) {
        heights[
          /** @type {HTMLElement} */ (element).dataset.annotationId ?? ""
        ] = /** @type {HTMLElement} */ (element).offsetHeight;
      }
      const items = ordered.map((annotation) => {
        const place = resolved[annotation.id];
        const range =
          place && place.status !== "orphaned"
            ? rangeFromOffsets(current, place.start, place.end)
            : null;
        return {
          id: annotation.id,
          top: range ? firstRect(range).top - origin : bottom,
          height: heights[annotation.id] ?? 0,
        };
      });
      return items;
    },
    (/** @type {import("./rail-layout.js").RailItem[] | null} */ items) => {
      if (!items) return;
      const laid = layoutRail(items, 8);
      tops = laid.tops;
      railHeight = laid.height;
      positioned = true;
    },
  ]);

  // The card, beside the text it is about.
  const placeCardJob = createFrameJob([
    () => {
      if (!frameRef || !columnRef || !ref || !index || !cardRef || !cardOpen) {
        return null;
      }
      const range = draft
        ? rangeFromOffsets(index, draft.range.start, draft.range.end)
        : cardId && resolved[cardId] && resolved[cardId].status !== "orphaned"
          ? rangeFromOffsets(
              index,
              resolved[cardId].start,
              resolved[cardId].end,
            )
          : null;
      const rects = range ? [...range.getClientRects()] : [];
      const point = cardPointer;
      /** The line the card hangs from: the one under the pointer, else the first (the last for a new comment). */
      let line = draft ? rects[rects.length - 1] : rects[0];
      if (point && !draft) {
        line =
          rects.find((r) => point.y >= r.top - 1 && point.y <= r.bottom + 1) ??
          line;
      }
      const item = railRef?.querySelector(`[data-annotation-id="${cardId}"]`);
      return {
        // An annotation whose text is gone hangs from its card in the rail.
        line:
          line ??
          range?.getBoundingClientRect() ??
          item?.getBoundingClientRect() ??
          null,
        beside: !range,
        column: columnRef.getBoundingClientRect(),
        frame: frameRef.getBoundingClientRect(),
        width: cardRef.offsetWidth,
        card: cardRef.offsetHeight,
        view: window.innerHeight,
      };
    },
    (/** @type {any} */ read) => {
      if (!read?.line) return;
      const { line, beside, column, frame, width, card, view } = read;
      const roomBelow = Math.min(view, frame.bottom) - line.bottom;
      const above = line.top - Math.max(0, frame.top);
      const flip =
        !beside && roomBelow < card + SELECTION_PAD && above > roomBelow;
      const top = beside
        ? line.top - column.top
        : flip
          ? line.top - card - SELECTION_PAD - column.top
          : line.bottom + SELECTION_PAD - column.top;
      const left = beside
        ? Math.max(0, line.left - column.left - width - SELECTION_PAD * 2)
        : Math.max(0, Math.min(line.left - column.left, column.width - width));
      cardPlace = { left, top };
      if (focusPending) {
        const target = focusPending;
        focusPending = null;
        tick().then(() =>
          (target === "composer" ? composerRef : cardRef)?.focus(),
        );
      }
    },
  ]);

  /**
   * The annotations under a point. A pointer only counts as on one when it
   * is over a line of its text, not in the room at the end of a line.
   * @param {number} x
   * @param {number} y
   * @returns {string[]} Ids, the narrowest range first.
   */
  function annotationsAt(x, y) {
    ensureFresh();
    if (!ref || !index) return [];
    const doc = ref.ownerDocument;
    /** @type {Node | null | undefined} */
    let node;
    let offset = 0;
    if (typeof doc.caretPositionFromPoint === "function") {
      const position = doc.caretPositionFromPoint(x, y);
      node = position?.offsetNode;
      offset = position?.offset ?? 0;
    } else if (typeof doc.caretRangeFromPoint === "function") {
      const caret = doc.caretRangeFromPoint(x, y);
      node = caret?.startContainer;
      offset = caret?.startOffset ?? 0;
    }
    if (!node || !ref.contains(node)) return [];
    const at = offsetOfPoint(index, node, offset);
    const hits = [];
    for (const annotation of annotations) {
      const place = resolved[annotation.id];
      if (!place || place.status === "orphaned") continue;
      if (at < place.start || at > place.end) continue;
      const range = rangeFromOffsets(index, place.start, place.end);
      if (!range) continue;
      for (const rect of range.getClientRects()) {
        if (
          x >= rect.left - 1 &&
          x <= rect.right + 1 &&
          y >= rect.top - 1 &&
          y <= rect.bottom + 1
        ) {
          hits.push({ id: annotation.id, size: place.end - place.start });
          break;
        }
      }
    }
    return hits.sort((a, b) => a.size - b.size).map((hit) => hit.id);
  }

  const handlePointerMove = rafThrottle((/** @type {unknown} */ event) => {
    const { pointerType, clientX, clientY } = /** @type {PointerEvent} */ (
      event
    );
    if (pointerType === "touch" || pointerDown) return;
    hover(clientX, clientY);
  });

  /**
   * @param {number} x
   * @param {number} y
   */
  function hover(x, y) {
    const hits = annotationsAt(x, y);
    if (hits.length) {
      clearTimeout(closeTimer);
      if (hits[0] !== hoverId) {
        hoverId = hits[0];
        clearTimeout(openTimer);
        if (!pinned && !draft) {
          openTimer = setTimeout(() => {
            if (hoverId) openCard(hoverId, { hits, point: { x, y } });
          }, TEXT_ANNOTATION_OPEN_DELAY_MS);
        }
      }
    } else if (hoverId) {
      leave();
    }
  }

  function leave() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      hoverId = null;
      if (!pinned && !draft) closeCard();
    }, TEXT_ANNOTATION_CLOSE_DELAY_MS);
  }

  function stay() {
    clearTimeout(closeTimer);
  }

  /**
   * @param {string} annotationId
   * @param {{ pin?: boolean, focus?: boolean, hits?: string[], point?: { x: number, y: number } | null, from?: HTMLElement | null }} [options]
   */
  function openCard(annotationId, options = {}) {
    if (draft) return;
    cardId = annotationId;
    alsoIds = options.hits ?? [];
    cardPointer = options.point ?? null;
    pinned = options.pin ?? pinned;
    if (options.from !== undefined) returnTo = options.from;
    if (pinned) activeId = annotationId;
    const annotation = annotations.find((a) => a.id === annotationId);
    if (annotation && (options.pin || options.focus)) {
      status = `${annotationDescription(annotation, excerpt(annotation.quote))}, ${repliesText(Math.max(0, annotation.comments.length - 1))}`;
    }
    if (options.focus) {
      focusPending = "card";
      placeCardJob.schedule();
    }
  }

  /** @param {{ restore?: boolean }} [options] */
  function closeCard(options = {}) {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    // Focus goes back only if it was in the card: a card opened by hovering
    // leaves the reader where they were.
    const hadFocus = Boolean(
      cardRef?.contains(cardRef.ownerDocument.activeElement),
    );
    cardId = null;
    pinned = false;
    draft = null;
    alsoIds = [];
    cardPlace = null;
    focusPending = null;
    if (options.restore && hadFocus) {
      const target = returnTo?.isConnected ? returnTo : ref;
      target?.focus({ preventScroll: true });
    }
    returnTo = null;
  }

  /** @param {MouseEvent} event */
  function handleClick(event) {
    if (pointerDown) return;
    const sel = ref?.ownerDocument.getSelection();
    if (sel && !sel.isCollapsed && ref?.contains(sel.anchorNode)) return;
    const hits = annotationsAt(event.clientX, event.clientY);
    if (hits.length) {
      hoverId = hits[0];
      openCard(hits[0], {
        pin: true,
        focus: true,
        hits,
        point: { x: event.clientX, y: event.clientY },
        from: ref,
      });
    } else if (pinned && !draft) {
      closeCard();
    }
  }

  /** @param {PointerEvent} event */
  function handlePointerDown(event) {
    if (event.pointerType !== "touch") pointerDown = true;
  }

  function handlePointerUp() {
    if (!pointerDown) return;
    pointerDown = false;
    updateSelection();
  }

  function updateSelection() {
    const next = readSelection();
    selection = next;
  }

  function readSelection() {
    if (!ref || !columnRef || readonly || draft) return null;
    const sel = ref.ownerDocument.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    if (!ref.contains(range.commonAncestorContainer)) return null;
    ensureFresh();
    if (!index) return null;
    const raw = offsetsFromRange(index, range);
    const { start, end } = trimOffsets(index.text, raw.start, raw.end);
    if (end <= start) return null;
    if (revealed && revealed.start === start && revealed.end === end)
      return null;
    const rects = range.getClientRects();
    const last = rects[rects.length - 1] ?? range.getBoundingClientRect();
    const column = columnRef.getBoundingClientRect();
    return {
      start,
      end,
      left: last.left + last.width / 2 - column.left,
      top: last.bottom - column.top + SELECTION_PAD,
    };
  }

  const handleSelectionChange = rafThrottle(() => {
    if (pointerDown) return;
    // A selection made by the rail is not one to comment on.
    updateSelection();
  });

  function newId() {
    const crypto = globalThis.crypto;
    return typeof crypto?.randomUUID === "function"
      ? crypto.randomUUID()
      : uniqueId("ta");
  }

  /**
   * Comment on the selected text. The same as the button and its shortcut.
   * @returns {void}
   */
  export function comment() {
    if (readonly || draft) return;
    const pending = readSelection();
    if (!pending || !index) return;
    draft = createAnchor(index.text, pending.start, pending.end);
    selection = null;
    clearTimeout(openTimer);
    cardId = null;
    pinned = true;
    returnTo = ref;
    ref?.ownerDocument.getSelection()?.removeAllRanges();
    focusPending = "composer";
    placeCardJob.schedule();
  }

  /**
   * Scroll an annotation into view and select its text.
   * @param {string} annotationId
   * @param {{ pin?: boolean, focus?: boolean, from?: HTMLElement | null }} [options] `pin` opens its card and keeps it open, `focus` moves focus into it.
   * @returns {void}
   */
  export function reveal(annotationId, options = {}) {
    ensureFresh();
    const place = resolved[annotationId];
    if (!ref || !index || !place || place.status === "orphaned") return;
    const range = rangeFromOffsets(index, place.start, place.end);
    if (!range) return;
    scrollIntoView(firstRect(range));
    const sel = ref.ownerDocument.getSelection();
    if (sel && !draft) {
      revealed = { start: place.start, end: place.end };
      sel.removeAllRanges();
      sel.addRange(range);
      selection = null;
    }
    if (options.pin || options.focus) {
      hoverId = null;
      openCard(annotationId, {
        pin: true,
        focus: options.focus,
        point: null,
        from: options.from,
      });
    }
    activeId = annotationId;
  }

  /** @param {DOMRect} rect */
  function scrollIntoView(rect) {
    if (!frameRef) return;
    const reduced =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = reduced ? "auto" : "smooth";
    const scrolls = height !== undefined;
    const top = scrolls ? frameRef.getBoundingClientRect().top : 0;
    const bottom = scrolls
      ? frameRef.getBoundingClientRect().bottom
      : window.innerHeight;
    if (rect.top >= top + 48 && rect.bottom <= bottom - 96) return;
    const delta = rect.top - (top + (bottom - top) / 3);
    if (scrolls) frameRef.scrollBy({ top: delta, behavior });
    else window.scrollBy({ top: delta, behavior });
  }

  /** @param {{ body: string }} detail */
  function handleSubmit({ body }) {
    const author = user;
    const created = { id: newId(), author, body, createdAt: Date.now() };
    if (draft) {
      const annotation = {
        id: newId(),
        range: draft.range,
        quote: draft.quote,
        prefix: draft.prefix,
        suffix: draft.suffix,
        comments: [created],
      };
      draft = null;
      if (dispatch("create", { annotation }, { cancelable: true })) {
        annotations = [...annotations, annotation];
        activeId = annotation.id;
      }
      status = createdText;
      closeCard({ restore: true });
      return;
    }
    if (!cardAnnotation) return;
    const next = {
      ...cardAnnotation,
      comments: [...cardAnnotation.comments, created],
    };
    if (
      dispatch(
        "reply",
        { annotation: next, comment: created },
        { cancelable: true },
      )
    ) {
      annotations = annotations.map((a) => (a.id === next.id ? next : a));
    }
  }

  function handleRemove() {
    const annotation = cardAnnotation;
    if (!annotation) return;
    if (dispatch("remove", { annotation }, { cancelable: true })) {
      annotations = annotations.filter((a) => a.id !== annotation.id);
      if (activeId === annotation.id) activeId = null;
      status = removedText;
      closeCard({ restore: true });
    }
  }

  // Escape is heard on the window, so it closes the card from wherever focus
  // is: on the rail button that opened it, or still in the text.
  /** @param {Event} event */
  function handleEscape(event) {
    const key = /** @type {KeyboardEvent} */ (event);
    if (key.key === "Escape" && !isImeComposition(key)) {
      closeCard({ restore: true });
    }
  }

  const ARROWS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]);

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (isImeComposition(event) || event.target !== ref) return;
    if (event.key === "Escape" && (cardOpen || activeId)) {
      closeCard();
      activeId = null;
      hoverId = null;
      return;
    }
    if (
      event.altKey &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      (event.key === "ArrowDown" || event.key === "ArrowUp")
    ) {
      event.preventDefault();
      step(event.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (event.shiftKey && !event.altKey && ARROWS.has(event.key)) {
      event.preventDefault();
      extendSelection(event);
    }
  }

  /** @param {1 | -1} direction */
  function step(direction) {
    const live = ordered.filter(
      (annotation) => resolved[annotation.id]?.status !== "orphaned",
    );
    if (!live.length) return;
    let at = live.findIndex((annotation) => annotation.id === activeId);
    if (at === -1) {
      const sel = ref?.ownerDocument.getSelection();
      const caret =
        sel?.focusNode && ref?.contains(sel.focusNode) && index
          ? offsetOfPoint(index, sel.focusNode, sel.focusOffset)
          : -1;
      at =
        direction === 1
          ? live.findIndex((a) => (resolved[a.id]?.start ?? 0) > caret) - 1
          : live.length -
            [...live]
              .reverse()
              .findIndex((a) => (resolved[a.id]?.start ?? 0) < caret);
      if (direction === 1 && at < -1) at = live.length - 1;
    }
    const next = live[Math.max(0, Math.min(live.length - 1, at + direction))];
    reveal(next.id, { pin: true, from: ref });
    status = annotationDescription(next, excerpt(next.quote));
  }

  /**
   * Shift and the arrows grow a selection in the document. Without a caret
   * in read-only text the browser does nothing, so the selection is moved here.
   * @param {KeyboardEvent} event
   */
  function extendSelection(event) {
    const sel = ref?.ownerDocument.getSelection();
    if (!ref || !sel || typeof sel.modify !== "function") return;
    if (!sel.rangeCount || !ref.contains(sel.anchorNode)) {
      const rect = ref.getBoundingClientRect();
      const doc = ref.ownerDocument;
      const rtl = getComputedStyle(ref).direction === "rtl";
      const x = rtl ? rect.right - 1 : rect.left + 1;
      const y = Math.min(Math.max(rect.top, 0) + 12, window.innerHeight - 8);
      const position = doc.caretPositionFromPoint?.(x, y);
      const caret = doc.caretRangeFromPoint?.(x, y);
      const node = position?.offsetNode ?? caret?.startContainer;
      const offset = position?.offset ?? caret?.startOffset ?? 0;
      if (node && ref.contains(node)) sel.collapse(node, offset);
      else if (index?.nodes[0]) sel.collapse(index.nodes[0], 0);
    }
    const vertical = event.key === "ArrowUp" || event.key === "ArrowDown";
    const granularity = vertical
      ? "line"
      : event.ctrlKey || event.altKey
        ? "word"
        : "character";
    const direction = vertical
      ? event.key === "ArrowDown"
        ? "forward"
        : "backward"
      : event.key === "ArrowRight"
        ? "right"
        : "left";
    sel.modify("extend", direction, granularity);
    if (sel.focusNode && !ref.contains(sel.focusNode)) sel.collapseToEnd();
    updateSelection();
  }

  /** @param {number} at */
  function focusRail(at) {
    railIndex = at;
    const button = /** @type {HTMLElement | undefined} */ (
      railRef?.querySelectorAll("[data-annotation-button]")[at]
    );
    button?.focus();
  }

  /**
   * @param {FocusEvent} event
   * @param {string} annotationId
   * @param {number} at
   */
  function handleRailFocus(event, annotationId, at) {
    railIndex = at;
    activeId = annotationId;
    const target = /** @type {HTMLElement} */ (event.currentTarget);
    if (!target.matches(":focus-visible")) return;
    const place = resolved[annotationId];
    if (place && place.status !== "orphaned" && index) {
      const range = rangeFromOffsets(index, place.start, place.end);
      if (range) scrollIntoView(firstRect(range));
    }
  }

  /**
   * @param {MouseEvent} event
   * @param {string} annotationId
   */
  function handleRailClick(event, annotationId) {
    const place = resolved[annotationId];
    const target = /** @type {HTMLElement} */ (event.currentTarget);
    if (place?.status === "orphaned") {
      openCard(annotationId, { pin: true, focus: true, from: target });
      return;
    }
    reveal(annotationId, { pin: true, focus: true, from: target });
  }

  /** @param {Event} event */
  function handleOutside(event) {
    if (isOutsideClick(event, [cardRef, ref, railRef]) && !draft) {
      closeCard();
    }
  }

  onMount(() => {
    mounted = true;
    const node = ref;
    if (!node) return;
    observer = new MutationObserver(() => {
      dirty = true;
      queueRefresh();
    });
    const stops = [
      observeResize(node, () => {
        measureJob.schedule();
        if (cardOpen) placeCardJob.schedule();
      }),
      addPooledListener("resize", () => {
        measureJob.schedule();
        placeCardJob.schedule();
      }),
    ];
    const doc = node.ownerDocument;
    doc.addEventListener("selectionchange", handleSelectionChange);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      queueRefresh.cancel();
      handlePointerMove.cancel();
      handleSelectionChange.cancel();
      measureJob?.cancel();
      placeCardJob?.cancel();
      observer?.disconnect();
      layer?.destroy();
      for (const stop of stops) stop();
      doc.removeEventListener("selectionchange", handleSelectionChange);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  });
</script>

<div
  bind:this={frameRef}
  class:bx--text-annotations={true}
  class:bx--text-annotations--rail={rail}
  class:bx--text-annotations--scroll={height !== undefined}
  class:bx--text-annotations--positioned={positioned}
  style:--ccs-text-annotations-height={frameStyleHeight}
  {...rootProps}
>
  <div bind:this={columnRef} class="bx--text-annotations__column">
    <!-- svelte-ignore a11y-no-noninteractive-tabindex a11y-no-noninteractive-element-interactions -->
    <div
      bind:this={ref}
      class="bx--text-annotations__document"
      class:bx--text-annotations__document--text={text !== undefined}
      role="region"
      tabindex="0"
      aria-label={ariaLabel ?? (labelText || undefined)}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={describedBy}
      aria-keyshortcuts="Alt+ArrowDown Alt+ArrowUp"
      on:keydown={handleKeydown}
      on:pointerdown={handlePointerDown}
      on:pointermove={handlePointerMove}
      on:pointerleave={leave}
      on:click={handleClick}
    >
      <slot
        >{#if text !== undefined}{text}{/if}</slot
      >
    </div>
    <p id="{baseId}-help" class="bx--visually-hidden">{helpText}</p>
    <div class="bx--visually-hidden" role="status" aria-live="polite">
      {status}
    </div>

    {#if selection && !cardOpen}
      <div
        class="bx--text-annotations__selection"
        style:left="{selection.left}px"
        style:top="{selection.top}px"
      >
        <!-- A press on the button must not collapse the selection. -->
        <Button
          size="sm"
          {shortcut}
          on:mousedown={(event) => event.preventDefault()}
          on:click={comment}
        >
          {commentText}
        </Button>
      </div>
    {/if}

    {#if cardOpen}
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <div
        bind:this={cardRef}
        class="bx--text-annotations__card"
        class:bx--text-annotations__card--placed={cardPlace !== null}
        role="dialog"
        tabindex="-1"
        aria-label={cardLabel}
        style:--ccs-text-annotations-card-left={cardPlace
          ? `${cardPlace.left}px`
          : undefined}
        style:--ccs-text-annotations-card-top={cardPlace
          ? `${cardPlace.top}px`
          : undefined}
        use:dismiss={{
          enabled: true,
          listeners: [
            { type: "pointerdown", handler: handleOutside },
            { type: "keydown", handler: handleEscape },
          ],
        }}
        on:pointerenter={stay}
        on:pointerleave={leave}
      >
        <Layer>
          <AnnotationThread
            id="{baseId}-thread"
            bind:composerRef
            annotation={draft ? null : cardAnnotation}
            quote={excerpt(draft ? draft.quote : (cardAnnotation?.quote ?? ""))}
            canReply={!readonly}
            canRemove={ownsCard}
            labelText={draft ? newCommentLabelText : replyLabelText}
            {submitText}
            {cancelText}
            {removeText}
            {closeIconDescription}
            on:submit={(event) => handleSubmit(event.detail)}
            on:close={() => closeCard({ restore: true })}
            on:remove={handleRemove}
          />
          {#if also.length}
            <div
              class="bx--text-annotations__also"
              role="group"
              aria-label={alsoText}
            >
              <p class="bx--text-annotations__also-label">{alsoText}</p>
              {#each also as other (other?.id)}
                {#if other}
                  <button
                    type="button"
                    class="bx--text-annotations__also-item"
                    on:click={() =>
                      openCard(other.id, {
                        pin: true,
                        focus: true,
                        hits: alsoIds,
                      })}
                  >
                    {annotationDescription(other, excerpt(other.quote))}
                  </button>
                {/if}
              {/each}
            </div>
          {/if}
        </Layer>
      </div>
    {/if}
  </div>

  {#if rail}
    <aside class="bx--text-annotations__rail" aria-label={railLabelText}>
      {#if ordered.length}
        <ul
          bind:this={railRef}
          class="bx--text-annotations__list"
          style:--ccs-text-annotations-rail-height="{railHeight}px"
          use:rovingFocus={{
            selector: "[data-annotation-button]",
            orientation: "vertical",
            wrap: false,
            itemsOnly: true,
            getActiveIndex: () => railIndex,
            onMove: focusRail,
          }}
        >
          {#each ordered as annotation, at (annotation.id)}
            {@const orphaned = resolved[annotation.id]?.status === "orphaned"}
            {@const replies = annotation.comments.length - 1}
            {@const first = annotation.comments[0]}
            <li
              class="bx--text-annotations__item"
              class:bx--text-annotations__item--active={paintedId ===
                annotation.id}
              class:bx--text-annotations__item--orphaned={orphaned}
              data-annotation-id={annotation.id}
              style:--ccs-text-annotations-top={annotation.id in tops
                ? `${tops[annotation.id]}px`
                : undefined}
            >
              <button
                type="button"
                class="bx--text-annotations__item-button"
                data-annotation-button
                tabindex={at === railIndex ? 0 : -1}
                aria-describedby="{baseId}-item-{at}"
                aria-current={activeId === annotation.id ? "true" : undefined}
                on:focus={(event) => handleRailFocus(event, annotation.id, at)}
                on:click={(event) => handleRailClick(event, annotation.id)}
                on:pointerenter={() => (hoverId = annotation.id)}
                on:pointerleave={() => (hoverId = null)}
              >
                <span class="bx--visually-hidden"
                  >{annotationDescription(
                    annotation,
                    excerpt(annotation.quote),
                  )}</span
                >
                <span
                  class="bx--text-annotations__item-quote"
                  dir="auto"
                  aria-hidden="true">{excerpt(annotation.quote)}</span
                >
              </button>
              <div
                id="{baseId}-item-{at}"
                class="bx--text-annotations__item-details"
              >
                {#if first}
                  <p class="bx--text-annotations__item-author">
                    {first.author.name}
                  </p>
                  <p class="bx--text-annotations__item-body" dir="auto">
                    {first.body}
                  </p>
                {/if}
                {#if replies > 0}
                  <p class="bx--text-annotations__item-replies">
                    {repliesText(replies)}
                  </p>
                {/if}
                {#if orphaned}
                  <p class="bx--text-annotations__item-orphaned">
                    {orphanedText}
                  </p>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="bx--text-annotations__empty">{emptyText}</p>
      {/if}
    </aside>
  {/if}
</div>
