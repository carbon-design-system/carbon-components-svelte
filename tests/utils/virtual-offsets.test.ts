import {
  createFixedOffsets,
  createOffsets,
} from "../../src/utils/virtual-offsets.js";

/** The offsets a plain prefix sum gives: the model the tree has to match. */
function model(sizes: Array<number | undefined>, estimate: number) {
  const offsets = [0];
  for (const size of sizes) offsets.push(offsets.at(-1)! + (size ?? estimate));
  return offsets;
}

describe("createOffsets", () => {
  it("places unmeasured items at the estimate", () => {
    const offsets = createOffsets({ count: 5, estimate: 40 });
    expect(offsets.total()).toBe(200);
    expect(offsets.offsetOf(3)).toBe(120);
    expect(offsets.indexAt(119)).toBe(2);
    expect(offsets.indexAt(120)).toBe(3);
  });

  it("moves every later offset when a size is measured", () => {
    const offsets = createOffsets({ count: 5, estimate: 40 });
    expect(offsets.set(1, 100)).toBe(true);
    expect(offsets.offsetOf(1)).toBe(40);
    expect(offsets.offsetOf(2)).toBe(140);
    expect(offsets.total()).toBe(260);
    expect(offsets.set(1, 100)).toBe(false);
  });

  it("changes the estimate for every unmeasured item at once", () => {
    const offsets = createOffsets({ count: 4, estimate: 10 });
    offsets.set(0, 50);
    offsets.setEstimate(20);
    expect(offsets.total()).toBe(50 + 3 * 20);
    expect(offsets.getMeasuredAverage()).toBe(50);
  });

  it("matches a prefix sum under random measurement", () => {
    let seed = 7;
    const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
    const count = 1500;
    const estimate = 33;
    const offsets = createOffsets({ count, estimate });
    const sizes: Array<number | undefined> = Array(count).fill(undefined);

    for (let round = 0; round < 400; round++) {
      const index = Math.floor(random() * count);
      const size = Math.floor(random() * 90);
      offsets.set(index, size);
      sizes[index] = size;
    }

    const expected = model(sizes, estimate);
    for (const index of [0, 1, 17, 500, 1499, 1500]) {
      expect(offsets.offsetOf(index)).toBeCloseTo(expected[index], 6);
    }

    for (let probe = 0; probe < 200; probe++) {
      const offset = random() * expected[count];
      // The last item that starts at or before `offset`.
      let want = 0;
      while (want + 1 <= count && expected[want + 1] <= offset) want += 1;
      expect(offsets.indexAt(offset)).toBe(Math.min(want, count - 1));
    }
  });

  it("takes sizes measured already, skipping what is not a size", () => {
    const sizes = [10, undefined, -5, Number.NaN, 30, undefined, 50];
    const offsets = createOffsets({ count: 8, estimate: 20, sizes });
    expect(offsets.get(0)).toBe(10);
    expect(offsets.get(1)).toBeUndefined();
    expect(offsets.get(2)).toBeUndefined();
    expect(offsets.get(3)).toBeUndefined();
    expect(offsets.get(4)).toBe(30);
    expect(offsets.get(6)).toBe(50);
    expect(offsets.measuredCount()).toBe(3);
    expect(offsets.total()).toBe(10 + 30 + 50 + 5 * 20);
    expect(offsets.offsetOf(5)).toBe(10 + 20 + 20 + 20 + 30);
  });

  it("finds where a viewport ends", () => {
    const offsets = createOffsets({ count: 4, estimate: 10 });
    expect(offsets.lowerBound(0)).toBe(0);
    expect(offsets.lowerBound(1)).toBe(1);
    expect(offsets.lowerBound(10)).toBe(1);
    expect(offsets.lowerBound(11)).toBe(2);
    expect(offsets.lowerBound(40)).toBe(4);
    expect(offsets.lowerBound(41)).toBe(5);
  });

  it("counts the items that fit a limit", () => {
    const offsets = createOffsets({ count: 4, estimate: 10 });
    offsets.set(0, 25);
    expect(offsets.countWithin(24)).toBe(0);
    expect(offsets.countWithin(25)).toBe(1);
    expect(offsets.countWithin(44)).toBe(2);
    expect(offsets.countWithin(1000)).toBe(4);
  });

  it("grows past its capacity and keeps what was measured", () => {
    const offsets = createOffsets({ count: 10, estimate: 5 });
    offsets.set(3, 50);
    offsets.setCount(5000);
    expect(offsets.count()).toBe(5000);
    expect(offsets.get(3)).toBe(50);
    expect(offsets.total()).toBe(50 + 4999 * 5);
  });

  it("forgets measurements past a shorter end", () => {
    const offsets = createOffsets({ count: 10, estimate: 5 });
    offsets.set(8, 50);
    offsets.setCount(4);
    offsets.setCount(10);
    expect(offsets.get(8)).toBeUndefined();
    expect(offsets.measuredCount()).toBe(0);
  });

  it("moves measured sizes with their items when the front changes", () => {
    const offsets = createOffsets({ count: 4, estimate: 10 });
    offsets.set(1, 99);
    offsets.shift(3);
    expect(offsets.count()).toBe(7);
    expect(offsets.get(4)).toBe(99);
    expect(offsets.get(1)).toBeUndefined();

    offsets.shift(-4);
    expect(offsets.count()).toBe(3);
    expect(offsets.get(0)).toBe(99);
  });

  it("treats zero as a real size", () => {
    const offsets = createOffsets({ count: 3, estimate: 10 });
    offsets.set(1, 0);
    expect(offsets.get(1)).toBe(0);
    expect(offsets.total()).toBe(20);
    expect(offsets.getMeasuredAverage()).toBe(0);
  });

  it("clears every measurement", () => {
    const offsets = createOffsets({ count: 3, estimate: 10 });
    offsets.set(0, 99);
    offsets.clear();
    expect(offsets.total()).toBe(30);
    expect(offsets.getMeasuredAverage()).toBeNull();
  });
});

describe("createFixedOffsets", () => {
  it("answers by arithmetic", () => {
    const offsets = createFixedOffsets({ count: 100, size: 24 });
    expect(offsets.total()).toBe(2400);
    expect(offsets.offsetOf(10)).toBe(240);
    expect(offsets.indexAt(250)).toBe(10);
    expect(offsets.indexAt(1e9)).toBe(99);
    expect(offsets.lowerBound(240)).toBe(10);
    expect(offsets.lowerBound(241)).toBe(11);
    expect(offsets.countWithin(100)).toBe(4);
  });
});
