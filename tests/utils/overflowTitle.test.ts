import { overflowTitle } from "../../src/utils/overflowTitle.js";

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

describe("overflowTitle action", () => {
  let node: HTMLElement;

  beforeEach(() => {
    node = document.createElement("div");
    node.textContent = "A very long label";
    // jsdom lacks innerText; stub from textContent.
    Object.defineProperty(node, "innerText", {
      configurable: true,
      get() {
        return this.textContent;
      },
    });
    document.body.appendChild(node);
  });

  afterEach(() => {
    node.remove();
  });

  test("sets title to the text content when truncated", () => {
    mockSize(node, 50, 120);
    overflowTitle(node);
    expect(node.getAttribute("title")).toBe("A very long label");
  });

  test("does not set title when the text fits", () => {
    mockSize(node, 120, 120);
    overflowTitle(node);
    expect(node.hasAttribute("title")).toBe(false);
  });

  test("removes a stale title once no longer truncated on update", () => {
    mockSize(node, 50, 120);
    const { update } = overflowTitle(node);
    expect(node.getAttribute("title")).toBe("A very long label");

    mockSize(node, 120, 120);
    update();
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

  test("measures a descendant when `measure` is provided", () => {
    const host = document.createElement("label");
    const span = document.createElement("span");
    span.textContent = "A very long label";
    Object.defineProperty(span, "innerText", {
      configurable: true,
      get() {
        return this.textContent;
      },
    });
    host.appendChild(span);
    document.body.appendChild(host);

    mockSize(span, 50, 120);
    overflowTitle(host, { measure: span });

    expect(host.getAttribute("title")).toBe("A very long label");
    host.remove();
  });

  test("falls back to measuring the node when `measure` is null", () => {
    mockSize(node, 50, 120);
    expect(() => overflowTitle(node, { measure: null })).not.toThrow();
    expect(node.getAttribute("title")).toBe("A very long label");
  });
});
