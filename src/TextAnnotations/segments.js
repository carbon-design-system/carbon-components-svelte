/**
 * Which stretches of text are annotated, and how: the pure half of the
 * highlight layer. A stretch carries the ids of every annotation over it,
 * so overlaps show as deeper stretches.
 */

/**
 * @typedef {object} AnnotationSpan
 * @property {string} id
 * @property {number} start
 * @property {number} end
 */

/**
 * @typedef {object} HighlightSegment
 * @property {number} start
 * @property {number} end
 * @property {string[]} ids The annotations over this stretch, in the order given.
 * @property {boolean} active Whether the active annotation covers it.
 * @property {boolean} draft Whether the unsaved selection covers it.
 */

/**
 * Split the text into stretches with the same set of annotations over
 * them, drop the stretches with none, and join neighbors that look alike.
 * @param {ReadonlyArray<AnnotationSpan>} spans
 * @param {{ activeId?: string | null, draft?: { start: number, end: number } | null }} [options]
 * @returns {HighlightSegment[]}
 */
export function computeSegments(spans, options = {}) {
  const { activeId = null, draft = null } = options;
  /** @type {Array<{ at: number, open: boolean, order: number, id: string }>} */
  const events = [];
  spans.forEach((span, order) => {
    if (span.end > span.start) {
      events.push({ at: span.start, open: true, order, id: span.id });
      events.push({ at: span.end, open: false, order, id: span.id });
    }
  });
  if (draft && draft.end > draft.start) {
    events.push({ at: draft.start, open: true, order: -1, id: "" });
    events.push({ at: draft.end, open: false, order: -1, id: "" });
  }
  events.sort((a, b) => a.at - b.at);

  /** @type {Map<number, string>} */
  const open = new Map();
  let drafting = 0;
  /** @type {HighlightSegment[]} */
  const out = [];
  let i = 0;
  while (i < events.length) {
    const at = events[i].at;
    while (i < events.length && events[i].at === at) {
      const event = events[i++];
      if (event.order === -1) drafting += event.open ? 1 : -1;
      else if (event.open) open.set(event.order, event.id);
      else open.delete(event.order);
    }
    const next = i < events.length ? events[i].at : at;
    if (next === at || (open.size === 0 && drafting === 0)) continue;
    const ids = [...open.keys()]
      .sort((a, b) => a - b)
      .map((order) => /** @type {string} */ (open.get(order)));
    /** @type {HighlightSegment} */
    const segment = {
      start: at,
      end: next,
      ids,
      active: activeId !== null && ids.includes(activeId),
      draft: drafting > 0,
    };
    const last = out[out.length - 1];
    if (last && last.end === segment.start && sameLook(last, segment)) {
      last.end = segment.end;
    } else {
      out.push(segment);
    }
  }
  return out;
}

/**
 * @param {HighlightSegment} a
 * @param {HighlightSegment} b
 */
function sameLook(a, b) {
  return (
    a.active === b.active &&
    a.draft === b.draft &&
    a.ids.length === b.ids.length &&
    a.ids.every((id, k) => id === b.ids[k])
  );
}

/**
 * @typedef {"base" | "overlap" | "active" | "draft"} HighlightKind
 */

/**
 * The ranges to paint for one kind of highlight: every annotated stretch,
 * the stretches with two or more annotations, the active annotation, or the
 * draft. Touching ranges are joined.
 * @param {ReadonlyArray<HighlightSegment>} segments
 * @param {HighlightKind} kind
 * @returns {Array<{ start: number, end: number }>}
 */
export function segmentsOfKind(segments, kind) {
  /** @type {Array<{ start: number, end: number }>} */
  const out = [];
  for (const segment of segments) {
    const included =
      kind === "base" ||
      (kind === "overlap" && segment.ids.length > 1) ||
      (kind === "active" && segment.active) ||
      (kind === "draft" && segment.draft);
    if (!included) continue;
    const last = out[out.length - 1];
    if (last && last.end === segment.start) last.end = segment.end;
    else out.push({ start: segment.start, end: segment.end });
  }
  return out;
}
