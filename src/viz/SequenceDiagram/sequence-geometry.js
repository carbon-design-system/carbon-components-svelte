// @ts-check
// Actor and message geometry for `SequenceDiagram`, kept out of the
// component so a test can count how often it runs.

/**
 * Place actors across the top, in the order given or first seen, and one
 * message per row down the page, each an arrow from its sender's lifeline
 * to its receiver's. A message to the sender itself is drawn as a loop
 * beside the lifeline. Messages keep input order unless `order` gives
 * another.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./sequence-geometry.d.ts").SequenceOptions<T>} options
 * @returns {import("./sequence-geometry.d.ts").Sequence<T>}
 */
export function buildSequence(rows, options) {
  const {
    from,
    to,
    label,
    kind,
    order,
    actors: given,
    actorWidth,
    actorGap,
    rowHeight,
    top,
  } = options;

  const messages = rows
    .map((row, index) => ({
      row,
      index,
      from: String(from(row, index)),
      to: String(to(row, index)),
      label: label ? String(label(row, index) ?? "") : "",
      kind: kind ? String(kind(row, index) ?? "call") : "call",
      order: order ? Number(order(row, index)) : index,
    }))
    .sort((a, b) => a.order - b.order || a.index - b.index);

  /** @type {string[]} */
  const names = given ? given.map(String) : [];
  for (const message of messages) {
    for (const name of [message.from, message.to]) {
      if (!names.includes(name)) names.push(name);
    }
  }
  const slot = actorWidth + actorGap;
  const actors = names.map((name, index) => ({
    name,
    index,
    x: actorWidth / 2 + index * slot,
  }));
  const xOf = new Map(actors.map((actor) => [actor.name, actor.x]));

  const laid = messages.map((message, step) => {
    const x1 = /** @type {number} */ (xOf.get(message.from));
    const x2 = /** @type {number} */ (xOf.get(message.to));
    const y = top + (step + 1) * rowHeight;
    const self = message.from === message.to;
    return {
      id: `${step}:${message.index}`,
      step,
      index: message.index,
      from: message.from,
      to: message.to,
      label: message.label,
      kind: message.kind,
      self,
      x1,
      x2,
      y,
      datum: message.row,
      // A loop beside the lifeline for a message to oneself; a straight
      // arrow otherwise.
      d: self
        ? `M${x1},${y - rowHeight * 0.3}h${actorGap * 0.6}v${rowHeight * 0.6}h${-actorGap * 0.6}`
        : `M${x1},${y}L${x2},${y}`,
      labelX: self ? x1 + actorGap * 0.6 + 6 : (x1 + x2) / 2,
      labelAnchor: self ? "start" : "middle",
    };
  });

  return {
    actors,
    messages: laid,
    width: names.length > 0 ? names.length * slot - actorGap : actorWidth,
    height: top + (messages.length + 1) * rowHeight,
  };
}
