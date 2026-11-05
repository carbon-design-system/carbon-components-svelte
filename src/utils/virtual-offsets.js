// @ts-check
// Where each item of a virtualized list starts, for sizes that are known only
// once measured.
//
// Offsets of measured items are two Fenwick trees: the sum of measured sizes
// and the count of measured items. An item nobody has measured takes the
// estimate, so the offset of item `i` is
//
//   sum(measured sizes before i) + (i - measured count before i) * estimate
//
// Changing the estimate, which happens whenever a measurement moves the
// running average, is then O(1) rather than a rebuild of every offset after
// the first unmeasured item. Setting a size, reading an offset and finding the
// item at an offset are all O(log n).

/**
 * @typedef {Object} Offsets
 * @property {() => number} count How many items the index holds.
 * @property {() => number} total Scroll size of every item, in pixels.
 * @property {(index: number) => number} offsetOf Distance from the start of
 * the list to the start of item `index`. `offsetOf(count)` is `total()`.
 * @property {(offset: number) => number} indexAt Index of the item that
 * contains `offset`: the last item that starts at or before it, clamped to the
 * list. `0` for an empty list.
 * @property {(limit: number) => number} countWithin The most items, counted
 * from the first, that end within `limit`: the largest `i` in `[0, count]`
 * with `offsetOf(i) <= limit`.
 * @property {(target: number) => number} lowerBound The first `i` in
 * `[0, count]` whose `offsetOf(i)` is at least `target`, or `count + 1` when
 * even the end of the list falls short of it. That makes it how many items
 * start before `target`: the end of a window that reaches `target`.
 * @property {(index: number, size: number) => boolean} set Record a measured
 * size. Returns whether it changed anything.
 * @property {(index: number) => number | undefined} get The measured size of
 * item `index`, or `undefined` if it has none.
 * @property {(index: number) => number} sizeOf The size layout gives item
 * `index`: measured, else the estimate.
 * @property {(estimate: number) => void} setEstimate
 * @property {() => number} getEstimate
 * @property {() => number | null} getMeasuredAverage Mean of the measured
 * sizes, or `null` when none is measured.
 * @property {() => number} measuredCount
 * @property {(count: number) => void} setCount Grow or truncate the list.
 * Items past the old end are unmeasured.
 * @property {(delta: number) => void} shift Insert `delta` unmeasured items at
 * the front when positive, or drop `-delta` items from the front when
 * negative. The sizes of the items that stay move with them.
 * @property {() => void} clear Forget every measured size.
 */

const UNMEASURED = -1;

/**
 * How close, in pixels, an offset has to be to a boundary to count as on it.
 * Offsets are sums of estimates and measurements, so two routes to the same
 * boundary differ in the last few bits, and a scroll position that was set from
 * one boundary can then read as one item short of it from the other. That moves
 * the start of the window by an item, which renders a row nobody measured.
 */
const EPSILON = 1e-6;

/**
 * @param {number} n
 * @returns {number} The smallest power of two at or above `n`, at least 16.
 */
function nextPowerOfTwo(n) {
  let power = 16;
  while (power < n) power *= 2;
  return power;
}

/**
 * An offsets index for items of unequal, measured size.
 *
 * @param {Object} [options]
 * @param {number} [options.count=0]
 * @param {number} [options.estimate=0] Size of an item with no measurement.
 * @param {ArrayLike<number | undefined>} [options.sizes] Sizes already
 * measured, by index. A hole, `undefined` or a negative or non-finite number is
 * not measured. Taking them here builds the trees in one pass, where setting
 * each is a log n walk.
 * @returns {Offsets}
 */
export function createOffsets({
  count: initialCount = 0,
  estimate: initialEstimate = 0,
  sizes: initialSizes = undefined,
} = {}) {
  let count = Math.max(0, Math.floor(initialCount));
  let estimate = initialEstimate;
  let capacity = 0;
  /**
   * Measured size per item, `UNMEASURED` where there is none.
   * @type {Float64Array}
   */
  let sizes = new Float64Array(0);
  /** Fenwick tree of measured sizes, 1-indexed. */
  let sumTree = new Float64Array(1);
  /** Fenwick tree of how many items are measured, 1-indexed. */
  let countTree = new Int32Array(1);
  let measuredCount = 0;
  let measuredTotal = 0;

  /**
   * Rebuild both trees from `sizes` in O(capacity).
   * @param {number} nextCapacity
   * @param {Float64Array} source Sizes to adopt, already `nextCapacity` long.
   */
  function build(nextCapacity, source) {
    capacity = nextCapacity;
    sizes = source;
    sumTree = new Float64Array(capacity + 1);
    countTree = new Int32Array(capacity + 1);
    measuredCount = 0;
    measuredTotal = 0;

    for (let i = 1; i <= capacity; i++) {
      const size = sizes[i - 1];
      if (size !== UNMEASURED) {
        sumTree[i] += size;
        countTree[i] += 1;
        measuredCount += 1;
        measuredTotal += size;
      }
      const parent = i + (i & -i);
      if (parent <= capacity) {
        sumTree[parent] += sumTree[i];
        countTree[parent] += countTree[i];
      }
    }
  }

  /**
   * Make room for `n` items.
   * @param {number} n
   */
  function ensureCapacity(n) {
    if (n <= capacity) return;
    const nextCapacity = nextPowerOfTwo(n);
    const next = new Float64Array(nextCapacity).fill(UNMEASURED);
    next.set(sizes.subarray(0, count));
    build(nextCapacity, next);
  }

  /**
   * @param {number} index
   * @param {number} size
   * @returns {boolean}
   */
  function set(index, size) {
    if (!(index >= 0 && index < count) || !(size >= 0)) return false;
    const previous = sizes[index];
    if (previous === size) return false;

    const sizeDelta = previous === UNMEASURED ? size : size - previous;
    const countDelta = previous === UNMEASURED ? 1 : 0;
    sizes[index] = size;
    measuredTotal += sizeDelta;
    measuredCount += countDelta;

    for (let node = index + 1; node <= capacity; node += node & -node) {
      sumTree[node] += sizeDelta;
      countTree[node] += countDelta;
    }
    return true;
  }

  /** @param {number} index */
  function offsetOf(index) {
    const end = Math.max(0, Math.min(Math.floor(index), count));
    let size = 0;
    let measured = 0;
    for (let node = end; node > 0; node -= node & -node) {
      size += sumTree[node];
      measured += countTree[node];
    }
    return size + (end - measured) * estimate;
  }

  /** @param {number} limit */
  function countWithin(limit) {
    // Walk down the tree, taking every node that still fits before `limit`.
    let position = 0;
    let accumulated = 0;
    for (let step = capacity; step > 0; step >>= 1) {
      const node = position + step;
      if (node > count) continue;
      const weight = sumTree[node] + (step - countTree[node]) * estimate;
      if (accumulated + weight <= limit + EPSILON) {
        position = node;
        accumulated += weight;
      }
    }
    return position;
  }

  /** @param {number} offset */
  function indexAt(offset) {
    if (count === 0) return 0;
    return Math.min(countWithin(offset), count - 1);
  }

  /** @param {number} target */
  function lowerBound(target) {
    if (!(target > 0)) return 0;

    // The most items whose offset is still short of `target`.
    let position = 0;
    let accumulated = 0;
    for (let step = capacity; step > 0; step >>= 1) {
      const node = position + step;
      if (node > count) continue;
      const weight = sumTree[node] + (step - countTree[node]) * estimate;
      if (accumulated + weight < target - EPSILON) {
        position = node;
        accumulated += weight;
      }
    }
    return position + 1;
  }

  /** @param {number} next */
  function setCount(next) {
    const target = Math.max(0, Math.floor(next));
    if (target === count) return;

    if (target > count) {
      ensureCapacity(target);
      count = target;
      return;
    }

    // Items past the new end give up their measurements.
    for (let index = target; index < count; index++) {
      const size = sizes[index];
      if (size === UNMEASURED) continue;
      sizes[index] = UNMEASURED;
      measuredTotal -= size;
      measuredCount -= 1;
      for (let node = index + 1; node <= capacity; node += node & -node) {
        sumTree[node] -= size;
        countTree[node] -= 1;
      }
    }
    count = target;
  }

  /** @param {number} delta */
  function shift(delta) {
    const amount = Math.trunc(delta);
    if (amount === 0) return;

    if (amount > 0) {
      const nextCount = count + amount;
      const nextCapacity = Math.max(capacity, nextPowerOfTwo(nextCount));
      const next = new Float64Array(nextCapacity).fill(UNMEASURED);
      next.set(sizes.subarray(0, count), amount);
      count = nextCount;
      build(nextCapacity, next);
      return;
    }

    const dropped = Math.min(-amount, count);
    const nextCount = count - dropped;
    const next = new Float64Array(capacity).fill(UNMEASURED);
    next.set(sizes.subarray(dropped, count));
    count = nextCount;
    build(capacity, next);
  }

  function clear() {
    if (measuredCount === 0) return;
    build(capacity, new Float64Array(capacity).fill(UNMEASURED));
  }

  if (initialSizes) {
    const capacity = nextPowerOfTwo(count);
    const source = new Float64Array(capacity).fill(UNMEASURED);
    for (let index = 0; index < count; index++) {
      const size = initialSizes[index];
      if (typeof size === "number" && size >= 0 && Number.isFinite(size)) {
        source[index] = size;
      }
    }
    build(capacity, source);
  } else {
    ensureCapacity(count);
  }

  return {
    count: () => count,
    total: () => offsetOf(count),
    offsetOf,
    indexAt,
    countWithin,
    lowerBound,
    set,
    get: (index) => {
      const size = index >= 0 && index < count ? sizes[index] : UNMEASURED;
      return size === UNMEASURED ? undefined : size;
    },
    sizeOf: (index) => {
      const size = index >= 0 && index < count ? sizes[index] : UNMEASURED;
      return size === UNMEASURED ? estimate : size;
    },
    setEstimate: (next) => {
      estimate = next;
    },
    getEstimate: () => estimate,
    getMeasuredAverage: () =>
      measuredCount > 0 ? measuredTotal / measuredCount : null,
    measuredCount: () => measuredCount,
    setCount,
    shift,
    clear,
  };
}

/**
 * The same index for items that all share one size: nothing is stored, and
 * every answer is arithmetic.
 *
 * @param {Object} [options]
 * @param {number} [options.count=0]
 * @param {number} [options.size=0]
 * @returns {Offsets}
 */
export function createFixedOffsets({
  count: initialCount = 0,
  size: initialSize = 0,
} = {}) {
  let count = Math.max(0, Math.floor(initialCount));
  let size = initialSize;

  return {
    count: () => count,
    total: () => count * size,
    offsetOf: (index) => Math.max(0, Math.min(Math.floor(index), count)) * size,
    indexAt: (offset) =>
      count === 0 || !(size > 0)
        ? 0
        : Math.max(0, Math.min(Math.floor(offset / size), count - 1)),
    countWithin: (limit) =>
      size > 0 ? Math.max(0, Math.min(Math.floor(limit / size), count)) : 0,
    lowerBound: (target) =>
      size > 0 ? Math.min(count + 1, Math.max(0, Math.ceil(target / size))) : 0,
    set: () => false,
    get: () => undefined,
    sizeOf: () => size,
    setEstimate: (next) => {
      size = next;
    },
    getEstimate: () => size,
    getMeasuredAverage: () => null,
    measuredCount: () => 0,
    setCount: (next) => {
      count = Math.max(0, Math.floor(next));
    },
    shift: (delta) => {
      count = Math.max(0, count + Math.trunc(delta));
    },
    clear: () => {},
  };
}
