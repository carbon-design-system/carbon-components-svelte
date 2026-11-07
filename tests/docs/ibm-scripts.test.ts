import { loadIbmScripts } from "../../docs/src/ibm-scripts";

describe("loadIbmScripts", () => {
  let idle: (() => void)[] = [];
  beforeEach(() => {
    idle = [];
    vi.stubGlobal("requestIdleCallback", (callback: () => void) => {
      idle.push(callback);
      return idle.length;
    });
    vi.stubGlobal("cancelIdleCallback", (id: number) => {
      idle[id - 1] = () => {};
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    for (const script of document.head.querySelectorAll("script")) {
      script.remove();
    }
  });

  const scripts = () =>
    [...document.head.querySelectorAll("script")].map((script) => script.src);

  it("adds IBM's scripts only once the browser is idle", () => {
    loadIbmScripts();
    expect(scripts()).toEqual([]);

    for (const run of idle) run();
    expect(scripts()).toEqual([
      "https://1.www.s81c.com/common/carbon-for-ibm-dotcom/tag/v1/latest/footer.min.js",
      "https://1.www.s81c.com/common/stats/ibm-common.js",
    ]);
  });

  it("adds nothing once cancelled", () => {
    loadIbmScripts()();
    for (const run of idle) run();
    expect(scripts()).toEqual([]);
  });
});
