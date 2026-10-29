// @vitest-environment node
import { get, writable } from "svelte/store";
import {
  createLoadingDelay,
  delayedLoading,
} from "../../src/utils/delayed-loading.js";

/**
 * Drives a timer through `[ms, loading]` steps (absolute times) and returns
 * every state change as `[ms, shown]`.
 */
function run(
  steps: [number, boolean][],
  options?: Parameters<typeof createLoadingDelay>[1],
) {
  const changes: [number, boolean][] = [];
  const start = Date.now();
  const update = createLoadingDelay(
    (shown) => changes.push([Date.now() - start, shown]),
    options,
  );
  let now = 0;
  for (const [at, loading] of steps) {
    vi.advanceTimersByTime(at - now);
    now = at;
    update(loading);
  }
  vi.advanceTimersByTime(5000);
  return changes;
}

describe("createLoadingDelay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each<[string, [number, boolean][], [number, boolean][]]>([
    [
      "shows nothing for work shorter than the delay",
      [
        [0, false],
        [10, true],
        [250, false],
      ],
      [[0, false]],
    ],
    [
      "shows after the delay and holds for the minimum duration",
      [
        [0, false],
        [0, true],
        [400, false],
      ],
      [
        [0, false],
        [300, true],
        [800, false],
      ],
    ],
    [
      "hides at once when the work outlasts the minimum duration",
      [
        [0, false],
        [0, true],
        [2000, false],
      ],
      [
        [0, false],
        [300, true],
        [2000, false],
      ],
    ],
    [
      "restarts the delay when work stops and starts again before it",
      [
        [0, false],
        [0, true],
        [200, false],
        [250, true],
        [900, false],
      ],
      [
        [0, false],
        [550, true],
        [1050, false],
      ],
    ],
    [
      "keeps the indicator up when work restarts during the minimum",
      [
        [0, false],
        [0, true],
        [400, false],
        [600, true],
        [2000, false],
      ],
      [
        [0, false],
        [300, true],
        [2000, false],
      ],
    ],
    [
      "ignores a repeated value",
      [
        [0, false],
        [0, true],
        [200, true],
        [400, false],
      ],
      [
        [0, false],
        [300, true],
        [800, false],
      ],
    ],
    [
      "shows at once when the first value is true",
      [
        [0, true],
        [100, false],
      ],
      [
        [0, true],
        [500, false],
      ],
    ],
  ])("%s", (_name, steps, expected) => {
    expect(run(steps)).toEqual(expected);
  });

  it("follows the input exactly with no delay and no minimum", () => {
    expect(
      run(
        [
          [0, false],
          [10, true],
          [20, false],
        ],
        { delay: 0, minDuration: 0 },
      ),
    ).toEqual([
      [0, false],
      [10, true],
      [20, false],
    ]);
  });

  it("cancel drops a pending change", () => {
    const onChange = vi.fn();
    const update = createLoadingDelay(onChange);
    update(false);
    update(true);
    update.cancel();
    vi.advanceTimersByTime(1000);
    expect(onChange.mock.calls).toEqual([[false]]);
  });
});

describe("delayedLoading", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("follows the source store with a delay and a minimum", () => {
    const loading = writable(false);
    const shown = delayedLoading(loading);
    const values: boolean[] = [];
    const unsubscribe = shown.subscribe((value) => values.push(value));

    loading.set(true);
    vi.advanceTimersByTime(299);
    expect(get(shown)).toBe(false);
    vi.advanceTimersByTime(1);
    expect(get(shown)).toBe(true);

    loading.set(false);
    vi.advanceTimersByTime(499);
    expect(get(shown)).toBe(true);
    vi.advanceTimersByTime(1);
    expect(values).toEqual([false, true, false]);

    unsubscribe();
  });

  it("starts from the source value and stops its timer on unsubscribe", () => {
    const loading = writable(true);
    const shown = delayedLoading(loading);
    const values: boolean[] = [];
    const unsubscribe = shown.subscribe((value) => values.push(value));
    expect(values).toEqual([true]);

    loading.set(false);
    unsubscribe();
    vi.advanceTimersByTime(1000);
    expect(values).toEqual([true]);
  });
});
