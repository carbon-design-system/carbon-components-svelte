import { overflowTitle } from "../../src/utils/overflow-title.js";

function mockSize(node: HTMLElement, offsetWidth: number, scrollWidth: number) {
  Object.defineProperty(node, "offsetWidth", {
    configurable: true,
    value: offsetWidth,
  });
  Object.defineProperty(node, "scrollWidth", {
    configurable: true,
    value: scrollWidth,
  });
}

/** Let the deferred measurement run. */
const settle = () => Promise.resolve();

describe("overflowTitle action", () => {
  let node: HTMLElement;

  beforeEach(() => {
    node = document.createElement("div");
    node.textContent = "A very long label";
    document.body.appendChild(node);
  });

  afterEach(() => {
    node.remove();
  });

  test("sets title to the text content when truncated", async () => {
    mockSize(node, 50, 120);
    overflowTitle(node);
    await settle();
    expect(node.getAttribute("title")).toBe("A very long label");
  });

  test("does not set title when the text fits", async () => {
    mockSize(node, 120, 120);
    overflowTitle(node);
    await settle();
    expect(node.hasAttribute("title")).toBe(false);
  });

  test("removes a stale title once no longer truncated on update", async () => {
    mockSize(node, 50, 120);
    const { update } = overflowTitle(node);
    await settle();
    expect(node.getAttribute("title")).toBe("A very long label");

    mockSize(node, 120, 120);
    update();
    await settle();
    expect(node.hasAttribute("title")).toBe(false);
  });

  test("uses a provided title instead of overflow detection", () => {
    mockSize(node, 120, 120);
    overflowTitle(node, { title: "Custom title" });
    expect(node.getAttribute("title")).toBe("Custom title");
  });

  test('keeps title="" when truncated', () => {
    mockSize(node, 50, 120);
    overflowTitle(node, { title: "" });
    expect(node.getAttribute("title")).toBe("");
  });

  test("measures a descendant when `measure` is provided", async () => {
    const host = document.createElement("label");
    const span = document.createElement("span");
    span.textContent = "A very long label";
    host.appendChild(span);
    document.body.appendChild(host);

    mockSize(span, 50, 120);
    overflowTitle(host, { measure: span });
    await settle();

    expect(host.getAttribute("title")).toBe("A very long label");
    host.remove();
  });

  test("falls back to measuring the node when `measure` is null", async () => {
    mockSize(node, 50, 120);
    expect(() => overflowTitle(node, { measure: null })).not.toThrow();
    await settle();
    expect(node.getAttribute("title")).toBe("A very long label");
  });

  test("defers measurement so a batch of mounts reads layout once", async () => {
    const nodes = Array.from({ length: 5 }, () => {
      const el = document.createElement("div");
      el.textContent = "label";
      document.body.appendChild(el);
      return el;
    });
    let reads = 0;
    for (const el of nodes) {
      Object.defineProperty(el, "offsetWidth", {
        configurable: true,
        get() {
          reads += 1;
          return 50;
        },
      });
      Object.defineProperty(el, "scrollWidth", {
        configurable: true,
        value: 120,
      });
    }

    for (const el of nodes) overflowTitle(el);
    // Nothing is read while the batch is still mounting.
    expect(reads).toBe(0);
    expect(nodes.every((el) => !el.hasAttribute("title"))).toBe(true);

    await settle();
    expect(reads).toBe(5);
    expect(nodes.every((el) => el.getAttribute("title") === "label")).toBe(
      true,
    );
    for (const el of nodes) el.remove();
  });

  test("applies an explicit title synchronously without measuring", () => {
    let reads = 0;
    Object.defineProperty(node, "offsetWidth", {
      configurable: true,
      get() {
        reads += 1;
        return 50;
      },
    });
    overflowTitle(node, { title: "Fixed" });
    expect(node.getAttribute("title")).toBe("Fixed");
    expect(reads).toBe(0);
  });

  test("does not measure after destroy", async () => {
    let reads = 0;
    Object.defineProperty(node, "offsetWidth", {
      configurable: true,
      get() {
        reads += 1;
        return 50;
      },
    });
    const { destroy } = overflowTitle(node);
    destroy();
    await settle();
    expect(reads).toBe(0);
    expect(node.hasAttribute("title")).toBe(false);
  });
});
