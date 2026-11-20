import { fitCount } from "../../src/TruncatedList/fit-count";

/** A line where each count takes `width(count)`, in a box of `available`. */
function line(width: (count: number) => number, available: number) {
  const probes: number[] = [];
  const fits = (count: number) => {
    probes.push(count);
    return width(count) <= available;
  };
  return { fits, probes };
}

describe("fitCount", () => {
  it("finds the largest count that fits", () => {
    for (let available = 0; available <= 520; available += 7) {
      const { fits } = line((count) => count * 10, available);
      const expected = Math.min(50, Math.max(1, Math.floor(available / 10)));

      expect(fitCount(50, fits)).toBe(expected);
    }
  });

  it("shows the minimum when even that does not fit", () => {
    expect(fitCount(10, () => false)).toBe(1);
    expect(fitCount(10, () => false, 0)).toBe(0);
  });

  it("returns upper when everything fits", () => {
    expect(fitCount(7, () => true)).toBe(7);
  });

  it("never probes outside the range", () => {
    const { fits, probes } = line((count) => count * 10, 1e9);
    fitCount(40, fits);

    expect(Math.max(...probes)).toBeLessThanOrEqual(40);
    expect(Math.min(...probes)).toBeGreaterThanOrEqual(2);
  });

  it("settles a thousand items with probes of a few items", () => {
    const { fits, probes } = line((count) => count * 10, 55);

    expect(fitCount(1000, fits)).toBe(5);
    expect(probes.length).toBeLessThanOrEqual(8);
    expect(Math.max(...probes)).toBeLessThanOrEqual(8);
  });

  it("returns the same count for the same width, whatever came before", () => {
    // A "12 more" wider than "9 more": the width is not strictly increasing.
    const width = (count: number) => count * 10 + (count >= 10 ? 8 : 0);
    const counts = new Map<number, number>();
    const sweep = [100, 40, 100, 77, 120, 40, 77, 120, 100];

    for (const available of sweep) {
      const result = fitCount(30, line(width, available).fits);
      expect(counts.get(available) ?? result).toBe(result);
      counts.set(available, result);
    }
  });

  it("is monotonic in the width", () => {
    let last = 0;
    for (let available = 0; available < 400; available += 3) {
      const result = fitCount(
        30,
        line((c) => c * 10 + (c >= 10 ? 8 : 0), available).fits,
      );

      expect(result).toBeGreaterThanOrEqual(last);
      last = result;
    }
  });
});
