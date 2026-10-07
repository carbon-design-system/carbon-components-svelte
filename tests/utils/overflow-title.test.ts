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

  it("sets title to the text content when truncated", async () => {
    mockSize(node, 50, 120);
    overflowTitle(node);
    await settle();
    expect(node.getAttribute("title")).toBe("A very long label");
  });

  it("does not set title when the text fits", async () => {
    mockSize(node, 120, 120);
    overflowTitle(node);
    await settle();
    expect(node.hasAttribute("title")).toBe(false);
  });

  it("removes a stale title once no longer truncated on update", async () => {
    mockSize(node, 50, 120);
    const { update } = overflowTitle(node);
    await settle();
    expect(node.getAttribute("title")).toBe("A very long label");

    mockSize(node, 120, 120);
    update();
    await settle();
    expect(node.hasAttribute("title")).toBe(false);
  });

  it("uses a provided title instead of overflow detection", () => {
    mockSize(node, 120, 120);
    overflowTitle(node, { title: "Custom title" });
    expect(node.getAttribute("title")).toBe("Custom title");
  });

  it('keeps title="" when truncated', () => {
    mockSize(node, 50, 120);
    overflowTitle(node, { title: "" });
    expect(node.getAttribute("title")).toBe("");
  });

  it("measures a descendant when `measure` is provided", async () => {
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

  it("falls back to measuring the node when `measure` is null", async () => {
    mockSize(node, 50, 120);
    expect(() => overflowTitle(node, { measure: null })).not.toThrow();
    await settle();
    expect(node.getAttribute("title")).toBe("A very long label");
  });

  it("defers measurement so a batch of mounts reads layout once", async () => {
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

  it("applies an explicit title synchronously without measuring", () => {
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

  it("does not measure after destroy", async () => {
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

  describe("lazy mode", () => {
    // jsdom may not implement `PointerEvent`; the listener only reads the
    // event type, so a plain `Event` is an equivalent stand-in.
    function firePointerEnter(target: HTMLElement) {
      target.dispatchEvent(
        typeof PointerEvent === "function"
          ? new PointerEvent("pointerenter")
          : new Event("pointerenter"),
      );
    }

    it("does not measure on mount", async () => {
      mockSize(node, 50, 120);
      overflowTitle(node, { lazy: true });
      await settle();
      expect(node.hasAttribute("title")).toBe(false);
    });

    it("measures on pointerenter", async () => {
      mockSize(node, 50, 120);
      overflowTitle(node, { lazy: true });
      await settle();
      firePointerEnter(node);
      expect(node.getAttribute("title")).toBe("A very long label");
    });

    it("measures on focusin", () => {
      mockSize(node, 50, 120);
      overflowTitle(node, { lazy: true });
      node.dispatchEvent(new Event("focusin"));
      expect(node.getAttribute("title")).toBe("A very long label");
    });

    it("removes a stale title once the node widens and is entered again", () => {
      mockSize(node, 50, 120);
      overflowTitle(node, { lazy: true });
      firePointerEnter(node);
      expect(node.getAttribute("title")).toBe("A very long label");

      mockSize(node, 120, 120);
      firePointerEnter(node);
      expect(node.hasAttribute("title")).toBe(false);
    });

    it("applies an explicit title immediately, without waiting for an event", () => {
      mockSize(node, 120, 120);
      overflowTitle(node, { lazy: true, title: "Custom title" });
      expect(node.getAttribute("title")).toBe("Custom title");
    });

    it("stops measuring once destroyed", () => {
      mockSize(node, 50, 120);
      const { destroy } = overflowTitle(node, { lazy: true });
      destroy();
      firePointerEnter(node);
      expect(node.hasAttribute("title")).toBe(false);
    });

    function fireWidthTransitionend(
      target: EventTarget,
      propertyName = "width",
    ) {
      // jsdom has no `TransitionEvent`; the listener only reads these fields.
      const event = new Event("transitionend", { bubbles: true });
      Object.defineProperty(event, "propertyName", { value: propertyName });
      target.dispatchEvent(event);
    }

    it.each([
      ["an ancestor's width transition", "width", true],
      ["another property's transition", "color", false],
    ])(
      "re-measures after %s ends while hovered: %s",
      (_, property, remeasured) => {
        const parent = document.createElement("div");
        document.body.appendChild(parent);
        parent.appendChild(node);
        mockSize(node, 120, 120);
        overflowTitle(node, { lazy: true });
        firePointerEnter(node);
        expect(node.hasAttribute("title")).toBe(false);

        mockSize(node, 50, 120);
        fireWidthTransitionend(parent, property as string);
        expect(node.hasAttribute("title")).toBe(remeasured);
        parent.remove();
      },
    );

    it("ignores width transitions after the pointer leaves", () => {
      mockSize(node, 120, 120);
      overflowTitle(node, { lazy: true });
      firePointerEnter(node);
      node.dispatchEvent(new Event("pointerleave"));

      mockSize(node, 50, 120);
      fireWidthTransitionend(document.body);
      expect(node.hasAttribute("title")).toBe(false);
    });

    it("stops measuring on mount/update once switched on via update", async () => {
      mockSize(node, 50, 120);
      const { update } = overflowTitle(node);
      await settle();
      expect(node.getAttribute("title")).toBe("A very long label");

      // Switching to lazy does not itself measure; the stale title survives
      // until the next hover or focus.
      mockSize(node, 120, 120);
      update({ lazy: true });
      await settle();
      expect(node.getAttribute("title")).toBe("A very long label");

      firePointerEnter(node);
      expect(node.hasAttribute("title")).toBe(false);
    });

    it("resumes mount/update measurement once switched off via update", async () => {
      mockSize(node, 50, 120);
      const { update } = overflowTitle(node, { lazy: true });
      await settle();
      expect(node.hasAttribute("title")).toBe(false);

      update({ lazy: false });
      await settle();
      expect(node.getAttribute("title")).toBe("A very long label");
    });
  });
});
