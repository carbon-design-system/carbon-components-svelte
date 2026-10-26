import {
  fromPage,
  inBand,
  observePage,
  scanBand,
} from "../../src/devtools/page-scan.js";

describe("inBand", () => {
  const band = { top: 0, bottom: 1000 };

  test("keeps a rect that overlaps the band", () => {
    expect(inBand({ top: 990, bottom: 1010 }, band, 0)).toBe(true);
  });

  test("drops a rect past either end", () => {
    expect(inBand({ top: 1001, bottom: 1100 }, band, 0)).toBe(false);
    expect(inBand({ top: -100, bottom: -1 }, band, 0)).toBe(false);
  });

  test("turns viewport rects into page coordinates", () => {
    expect(inBand({ top: 10, bottom: 20 }, band, 2000)).toBe(false);
  });
});

describe("scanBand", () => {
  test("covers one viewport above and below", () => {
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(
      800,
    );
    vi.spyOn(window, "scrollY", "get").mockReturnValue(1000);
    expect(scanBand()).toEqual({ top: 200, bottom: 2600 });
    vi.restoreAllMocks();
  });
});

describe("fromPage", () => {
  test("ignores changes inside a dev tool", () => {
    const tool = document.createElement("div");
    tool.setAttribute("data-ccs-dev-tool", "");
    const child = document.createElement("span");
    tool.append(child);
    expect(
      fromPage({
        type: "attributes",
        target: child,
      } as unknown as MutationRecord),
    ).toBe(false);
  });

  test("ignores a dev tool probe added to the page", () => {
    const probe = document.createElement("div");
    probe.setAttribute("data-ccs-dev-tool", "");
    expect(
      fromPage({
        type: "childList",
        target: document.body,
        addedNodes: [probe],
        removedNodes: [],
      } as unknown as MutationRecord),
    ).toBe(false);
  });

  test("counts page content", () => {
    expect(
      fromPage({
        type: "childList",
        target: document.body,
        addedNodes: [document.createElement("p")],
        removedNodes: [],
      } as unknown as MutationRecord),
    ).toBe(true);
  });
});

describe("observePage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("requestIdleCallback", (callback: () => void) =>
      setTimeout(callback, 0),
    );
    vi.stubGlobal("cancelIdleCallback", (id: number) => clearTimeout(id));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  test("scans once at once", () => {
    const callback = vi.fn();
    const page = observePage(callback);
    expect(callback).toHaveBeenCalledTimes(1);
    page.destroy();
  });

  test("throttles a page that keeps changing", async () => {
    const callback = vi.fn();
    const page = observePage(callback, { intervalMs: 250 });
    const clock = document.createElement("time");
    document.body.append(clock);
    // Ten changes over one second.
    let tick = 0;
    const id = setInterval(() => {
      clock.textContent = String(tick++);
    }, 100);
    await vi.advanceTimersByTimeAsync(1000);
    clearInterval(id);
    await vi.advanceTimersByTimeAsync(300);
    // The first scan, then at most one per 250ms.
    expect(callback.mock.calls.length).toBeGreaterThan(2);
    expect(callback.mock.calls.length).toBeLessThanOrEqual(6);
    page.destroy();
  });

  test("ignores changes inside the dev tools", async () => {
    const tool = document.createElement("div");
    tool.setAttribute("data-ccs-dev-tool", "");
    document.body.append(tool);
    const callback = vi.fn();
    const page = observePage(callback);
    await vi.advanceTimersByTimeAsync(500);
    callback.mockClear();
    tool.textContent = "redrawn";
    tool.append(document.createElement("span"));
    await vi.advanceTimersByTimeAsync(500);
    expect(callback).not.toHaveBeenCalled();
    page.destroy();
  });

  test("stops after destroy", async () => {
    const callback = vi.fn();
    const page = observePage(callback);
    page.destroy();
    document.body.append(document.createElement("p"));
    page.schedule();
    await vi.advanceTimersByTimeAsync(500);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
