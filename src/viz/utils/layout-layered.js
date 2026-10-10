// @ts-check
// Layered layout for a directed graph: nodes in ranks, edges running one
// way, crossings reduced by barycenter sweeps. The general case of which a
// tree is the special one, so a service map, a pipeline, or a dependency
// graph can be drawn without a layout dependency.

/**
 * @typedef {{ id: string; label: string; lane: string | undefined; datum: unknown; index: number; out: string[]; in: string[] }} Vertex
 */

/**
 * Lay a directed graph out in ranks. Cycles are cut by reversing the edges
 * that would close one, and those edges are marked so they can be drawn
 * apart. A node in `collapsed` keeps its place but everything reachable
 * only through it is left out. With `lanes`, nodes sharing a lane sit in
 * one band across the ranks, and the bands run in lane order.
 *
 * @template T
 * @param {ReadonlyArray<{ id: string | number; label?: string; lane?: string | number; datum?: T }>} nodes
 * @param {ReadonlyArray<{ source: string | number; target: string | number }>} edges
 * @param {import("./layout-layered.d.ts").LayeredOptions} [options]
 * @returns {import("./layout-layered.d.ts").LayeredLayout<T>}
 */
export function layoutLayered(nodes, edges, options = {}) {
  const {
    rankDir = "TB",
    nodeWidth = 120,
    nodeHeight = 36,
    rankGap = 40,
    nodeGap = 24,
    collapsed = [],
    lanes,
    sweeps = 8,
  } = options;

  /** @type {Map<string, Vertex>} */
  const byId = new Map();
  nodes.forEach((node, index) => {
    const id = String(node.id);
    if (byId.has(id)) return;
    byId.set(id, {
      id,
      label: node.label === undefined ? id : String(node.label),
      lane: node.lane === undefined ? undefined : String(node.lane),
      datum: node.datum,
      index,
      out: [],
      in: [],
    });
  });
  /** @type {Array<{ source: string; target: string }>} */
  const links = [];
  const seenLinks = new Set();
  for (const edge of edges) {
    const source = String(edge.source);
    const target = String(edge.target);
    const key = `${source}\u0000${target}`;
    if (source === target || !byId.has(source) || !byId.has(target)) continue;
    if (seenLinks.has(key)) continue;
    seenLinks.add(key);
    links.push({ source, target });
    /** @type {Vertex} */ (byId.get(source)).out.push(target);
    /** @type {Vertex} */ (byId.get(target)).in.push(source);
  }

  // Cycles: a depth-first walk in input order; an edge back onto the path
  // is reversed for ranking and remembered.
  const reversed = new Set();
  const state = new Map();
  /** @param {string} id */
  function walk(id) {
    state.set(id, 1);
    for (const next of /** @type {Vertex} */ (byId.get(id)).out) {
      const mark = state.get(next);
      if (mark === 1) reversed.add(`${id}\u0000${next}`);
      else if (mark === undefined) walk(next);
    }
    state.set(id, 2);
  }
  for (const vertex of byId.values())
    if (!state.has(vertex.id)) walk(vertex.id);
  const dag = links.map((link) =>
    reversed.has(`${link.source}\u0000${link.target}`)
      ? {
          source: link.target,
          target: link.source,
          reversed: true,
          original: link,
        }
      : {
          source: link.source,
          target: link.target,
          reversed: false,
          original: link,
        },
  );
  /** @type {Map<string, string[]>} */
  const after = new Map([...byId.keys()].map((id) => [id, []]));
  /** @type {Map<string, number>} */
  const inDegree = new Map([...byId.keys()].map((id) => [id, 0]));
  for (const link of dag) {
    /** @type {string[]} */ (after.get(link.source)).push(link.target);
    inDegree.set(
      link.target,
      /** @type {number} */ (inDegree.get(link.target)) + 1,
    );
  }

  // Collapse: what is reachable from a root, along the cycle-free edges,
  // without passing through a collapsed node stays; the rest folds away
  // and is counted on the node that hides it.
  const closed = new Set(collapsed.map(String));
  const roots = [...byId.values()].filter(
    (vertex) => inDegree.get(vertex.id) === 0,
  );
  const starts = roots.length > 0 ? roots : [...byId.values()];
  const kept = new Set();
  const stack = starts.map((vertex) => vertex.id);
  while (stack.length > 0) {
    const id = /** @type {string} */ (stack.pop());
    if (kept.has(id)) continue;
    kept.add(id);
    if (closed.has(id)) continue;
    for (const next of /** @type {string[]} */ (after.get(id)))
      stack.push(next);
  }
  /** @type {Map<string, number>} */
  const hiddenBy = new Map();
  for (const id of closed) {
    if (!kept.has(id)) continue;
    const seen = new Set();
    const queue = [.../** @type {string[]} */ (after.get(id))];
    while (queue.length > 0) {
      const next = /** @type {string} */ (queue.pop());
      if (seen.has(next) || kept.has(next)) continue;
      seen.add(next);
      for (const beyond of /** @type {string[]} */ (after.get(next)))
        queue.push(beyond);
    }
    hiddenBy.set(id, seen.size);
  }
  const visible = [...byId.values()].filter((vertex) => kept.has(vertex.id));
  const directed = dag.filter(
    (link) => kept.has(link.source) && kept.has(link.target),
  );

  // Ranks by longest path from a source.
  /** @type {Map<string, number>} */
  const rank = new Map();
  /** @type {Map<string, number>} */
  const remaining = new Map(visible.map((vertex) => [vertex.id, 0]));
  /** @type {Map<string, string[]>} */
  const succ = new Map(visible.map((vertex) => [vertex.id, []]));
  for (const link of directed) {
    remaining.set(
      link.target,
      /** @type {number} */ (remaining.get(link.target)) + 1,
    );
    /** @type {string[]} */ (succ.get(link.source)).push(link.target);
  }
  const ready = visible
    .filter((vertex) => remaining.get(vertex.id) === 0)
    .map((v) => v.id);
  for (const id of ready) rank.set(id, 0);
  while (ready.length > 0) {
    const id = /** @type {string} */ (ready.shift());
    const own = /** @type {number} */ (rank.get(id));
    for (const next of /** @type {string[]} */ (succ.get(id))) {
      rank.set(next, Math.max(rank.get(next) ?? 0, own + 1));
      const left = /** @type {number} */ (remaining.get(next)) - 1;
      remaining.set(next, left);
      if (left === 0) ready.push(next);
    }
  }
  for (const vertex of visible)
    if (!rank.has(vertex.id)) rank.set(vertex.id, 0);
  const rankCount = visible.length > 0 ? Math.max(...rank.values()) + 1 : 0;

  // Long edges pass through a placeholder in every rank they skip, so
  // ordering can keep them from crossing what they pass.
  /** @type {Array<{ id: string; rank: number; real: boolean; lane: string | undefined; index: number }>} */
  const slots = visible.map((vertex) => ({
    id: vertex.id,
    rank: /** @type {number} */ (rank.get(vertex.id)),
    real: true,
    lane: vertex.lane,
    index: vertex.index,
  }));
  /** @type {Array<{ from: string; to: string; edge: (typeof directed)[number] }>} */
  const segments = [];
  /** @type {Map<string, string[]>} */
  const chain = new Map();
  let dummies = 0;
  for (const link of directed) {
    const a = /** @type {number} */ (rank.get(link.source));
    const b = /** @type {number} */ (rank.get(link.target));
    let previous = link.source;
    /** @type {string[]} */
    const through = [];
    // A placeholder keeps to the lane the edge leaves from, so a long edge
    // runs down its own band and crosses over only at the end.
    const fromLane = /** @type {Vertex} */ (byId.get(link.source)).lane;
    for (let r = a + 1; r < b; r++) {
      const id = `\u0000${dummies++}`;
      slots.push({
        id,
        rank: r,
        real: false,
        lane: fromLane,
        index: Number.MAX_SAFE_INTEGER,
      });
      segments.push({ from: previous, to: id, edge: link });
      through.push(id);
      previous = id;
    }
    segments.push({ from: previous, to: link.target, edge: link });
    chain.set(`${link.source}\u0000${link.target}`, through);
  }
  /** @type {Map<string, string[]>} */
  const below = new Map(slots.map((slot) => [slot.id, []]));
  /** @type {Map<string, string[]>} */
  const above = new Map(slots.map((slot) => [slot.id, []]));
  for (const segment of segments) {
    /** @type {string[]} */ (below.get(segment.from)).push(segment.to);
    /** @type {string[]} */ (above.get(segment.to)).push(segment.from);
  }

  // Order within each rank: start in input order, then sweep down and up,
  // sorting by the mean position of neighbors in the rank just visited.
  const laneOrder = lanes
    ? lanes.map(String)
    : [...new Set(visible.map((v) => v.lane).filter((l) => l !== undefined))];
  /** @param {string | undefined} lane */
  const laneIndex = (lane) =>
    lane === undefined ? laneOrder.length : laneOrder.indexOf(lane);
  /** @type {Array<Array<(typeof slots)[number]>>} */
  const ranks = Array.from({ length: rankCount }, () => []);
  for (const slot of slots) ranks[slot.rank].push(slot);
  for (const level of ranks) level.sort((a, b) => a.index - b.index);
  /** @type {Map<string, number>} */
  const position = new Map();
  for (const level of ranks) {
    for (const [i, slot] of level.entries()) position.set(slot.id, i);
  }
  /**
   * @param {(typeof slots)[number]} slot
   * @param {Map<string, string[]>} neighbors
   */
  const barycenter = (slot, neighbors) => {
    const list = /** @type {string[]} */ (neighbors.get(slot.id));
    if (list.length === 0) return /** @type {number} */ (position.get(slot.id));
    let sum = 0;
    for (const id of list) sum += /** @type {number} */ (position.get(id));
    return sum / list.length;
  };
  for (let sweep = 0; sweep < sweeps; sweep++) {
    const down = sweep % 2 === 0;
    const order = down
      ? ranks.map((_, r) => r).slice(1)
      : ranks
          .map((_, r) => r)
          .slice(0, -1)
          .reverse();
    for (const r of order) {
      const neighbors = down ? above : below;
      const keyed = ranks[r].map((slot) => ({
        slot,
        lane: laneIndex(slot.lane),
        mean: barycenter(slot, neighbors),
      }));
      keyed.sort((a, b) => a.lane - b.lane || a.mean - b.mean);
      ranks[r] = keyed.map((entry) => entry.slot);
      for (const [i, slot] of ranks[r].entries()) position.set(slot.id, i);
    }
  }
  // Coordinates across the ranks. Along a rank, a real node is as wide as
  // a node and a placeholder is a point. Without lanes, each node moves
  // toward the mean of its neighbors while keeping its order and a gap,
  // and each rank is re-centered so nothing drifts to one side; with
  // lanes, each lane is a band wide enough for its fullest rank.
  const swap = rankDir === "LR";
  const acrossSize = swap ? nodeHeight : nodeWidth;
  const alongSize = swap ? nodeWidth : nodeHeight;
  const slotWidth = acrossSize + nodeGap;
  /** @param {(typeof slots)[number]} slot */
  const sizeOf = (slot) => (slot.real ? acrossSize : 0);
  /** @type {Map<string, number>} */
  const across = new Map();
  /** @type {Array<{ key: string; x0: number; x1: number }>} */
  const bands = [];
  if (laneOrder.length > 0) {
    const keys = [...laneOrder, "\u0000none"];
    /** @type {Map<string, number>} */
    const widest = new Map(keys.map((key) => [key, 0]));
    for (const level of ranks) {
      /** @type {Map<string, number>} */
      const counts = new Map();
      for (const slot of level) {
        const key = slot.lane === undefined ? "\u0000none" : slot.lane;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      for (const [key, count] of counts) {
        widest.set(
          key,
          Math.max(/** @type {number} */ (widest.get(key)), count),
        );
      }
    }
    let offset = 0;
    /** @type {Map<string, number>} */
    const start = new Map();
    for (const key of keys) {
      const count = /** @type {number} */ (widest.get(key));
      if (count === 0) continue;
      start.set(key, offset);
      const width = count * slotWidth - nodeGap;
      if (key !== "\u0000none")
        bands.push({ key, x0: offset, x1: offset + width });
      offset += width + nodeGap * 2;
    }
    for (const level of ranks) {
      /** @type {Map<string, number>} */
      const counts = new Map();
      for (const slot of level) {
        const key = slot.lane === undefined ? "\u0000none" : slot.lane;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      /** @type {Map<string, number>} */
      const used = new Map();
      for (const slot of level) {
        const key = slot.lane === undefined ? "\u0000none" : slot.lane;
        const at = used.get(key) ?? 0;
        used.set(key, at + 1);
        const width =
          /** @type {number} */ (widest.get(key)) * slotWidth - nodeGap;
        const rowWidth =
          /** @type {number} */ (counts.get(key)) * slotWidth - nodeGap;
        // Centered in the band, and a placeholder centered in its slot.
        across.set(
          slot.id,
          /** @type {number} */ (start.get(key)) +
            (width - rowWidth) / 2 +
            at * slotWidth +
            (acrossSize - sizeOf(slot)) / 2,
        );
      }
    }
  } else {
    for (const level of ranks) {
      let at = 0;
      for (const slot of level) {
        across.set(slot.id, at);
        at += sizeOf(slot) + nodeGap;
      }
    }
    for (let pass = 0; pass < 6; pass++) {
      const order = pass % 2 === 0 ? ranks : [...ranks].reverse();
      for (const level of order) {
        const desired = level.map((slot) => {
          const around = [
            .../** @type {string[]} */ (above.get(slot.id)),
            .../** @type {string[]} */ (below.get(slot.id)),
          ];
          if (around.length === 0)
            return /** @type {number} */ (across.get(slot.id));
          let sum = 0;
          for (const id of around) {
            const other = slots.find((s) => s.id === id);
            // Compare centers, so a point and a box line up.
            sum +=
              /** @type {number} */ (across.get(id)) +
              (other ? sizeOf(other) : 0) / 2;
          }
          return sum / around.length - sizeOf(slot) / 2;
        });
        // Keep the order and the gap, then slide the rank back so it sits
        // where its nodes wanted to be on average.
        /** @type {number[]} */
        const placed = [];
        for (let i = 0; i < level.length; i++) {
          const least =
            i === 0
              ? Number.NEGATIVE_INFINITY
              : placed[i - 1] + sizeOf(level[i - 1]) + nodeGap;
          placed.push(Math.max(desired[i], least));
        }
        let drift = 0;
        for (let i = 0; i < level.length; i++) drift += placed[i] - desired[i];
        drift /= Math.max(level.length, 1);
        for (const [i, slot] of level.entries())
          across.set(slot.id, placed[i] - drift);
      }
    }
    let least = Number.POSITIVE_INFINITY;
    for (const value of across.values()) least = Math.min(least, value);
    if (Number.isFinite(least))
      for (const [id, value] of across) across.set(id, value - least);
  }

  const along = (/** @type {number} */ r) => r * (alongSize + rankGap);
  /** @param {number} a Across, before any swap. @param {number} b Along. */
  const point = (a, b) => (swap ? { x: b, y: a } : { x: a, y: b });
  let extent = 0;
  for (const slot of slots) {
    extent = Math.max(
      extent,
      /** @type {number} */ (across.get(slot.id)) + sizeOf(slot),
    );
  }
  const depth = rankCount > 0 ? along(rankCount - 1) + alongSize : 0;

  const laidNodes = visible.map((vertex) => {
    const a = /** @type {number} */ (across.get(vertex.id));
    const b = along(/** @type {number} */ (rank.get(vertex.id)));
    const { x, y } = point(a, b);
    return {
      id: vertex.id,
      label: vertex.label,
      lane: vertex.lane,
      datum: /** @type {T} */ (vertex.datum),
      index: vertex.index,
      rank: /** @type {number} */ (rank.get(vertex.id)),
      order: /** @type {number} */ (position.get(vertex.id)),
      x,
      y,
      width: nodeWidth,
      height: nodeHeight,
      children: vertex.out.length,
      parents: vertex.in.length,
      collapsed: closed.has(vertex.id),
      hidden: hiddenBy.get(vertex.id) ?? 0,
    };
  });
  const center = (/** @type {string} */ id, /** @type {number} */ side) => {
    const slot = /** @type {(typeof slots)[number]} */ (
      slots.find((s) => s.id === id)
    );
    const a = /** @type {number} */ (across.get(id)) + sizeOf(slot) / 2;
    const b =
      along(slot.rank) + (side > 0 ? alongSize : side < 0 ? 0 : alongSize / 2);
    return point(a, b);
  };

  const laidEdges = directed.map((link) => {
    const through = /** @type {string[]} */ (
      chain.get(`${link.source}\u0000${link.target}`)
    );
    const points = [
      center(link.source, 1),
      ...through.map((id) => center(id, 0)),
      center(link.target, -1),
    ];
    if (link.reversed) points.reverse();
    return {
      id: `${link.original.source}\u0000${link.original.target}`.replace(
        "\u0000",
        "->",
      ),
      source: link.original.source,
      target: link.original.target,
      reversed: link.reversed,
      points,
    };
  });
  laidNodes.sort((a, b) => a.rank - b.rank || a.order - b.order);

  return {
    nodes: laidNodes,
    edges: laidEdges,
    lanes: bands.map((band) => {
      const from = point(band.x0, 0);
      const to = point(band.x1, depth);
      return { key: band.key, x0: from.x, y0: from.y, x1: to.x, y1: to.y };
    }),
    width: swap ? depth : extent,
    height: swap ? extent : depth,
    ranks: rankCount,
  };
}
