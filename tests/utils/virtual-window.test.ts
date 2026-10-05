import {
  PINNED_WINDOW_ATTRIBUTE,
  syncPinnedWindow,
  virtualWindow,
} from "../../src/utils/virtual-window.js";

function buildLayer() {
  const container = document.createElement("div");
  const spacer = document.createElement("div");
  const layer = document.createElement("div");
  spacer.appendChild(layer);
  container.appendChild(spacer);
  document.body.appendChild(container);
  return { container, layer };
}

describe("virtualWindow", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("translates an unpinned window to its offset", () => {
    const { layer } = buildLayer();

    virtualWindow(layer, { offsetY: 400, scrollTop: 520 });

    expect(layer.style.transform).toBe("translateY(400px)");
    expect(layer.style.position).toBe("");
    expect(layer.hasAttribute(PINNED_WINDOW_ATTRIBUTE)).toBe(false);
  });

  it("makes a pinned window a zero-height sticky layer", () => {
    const { layer } = buildLayer();

    virtualWindow(layer, { offsetY: 400, scrollTop: 520, pinned: true });

    expect(layer.style.position).toBe("sticky");
    expect(layer.style.top).toBe("0px");
    expect(layer.style.height).toBe("0px");
    expect(layer.getAttribute(PINNED_WINDOW_ATTRIBUTE)).toBe("400");
  });

  it("translates a pinned window back by the scroll position", () => {
    const { layer } = buildLayer();

    virtualWindow(layer, { offsetY: 400, scrollTop: 520, pinned: true });

    // Sticky moves the layer down 520px; the rows land at their 400px offset.
    expect(layer.style.transform).toBe("translateY(-120px)");
  });

  it("ignores overscroll above the top, as sticky positioning does", () => {
    const { layer } = buildLayer();

    virtualWindow(layer, { offsetY: 0, scrollTop: -30, pinned: true });

    expect(layer.style.transform).toBe("translateY(0px)");
  });

  it("follows updates and unpins cleanly", () => {
    const { layer } = buildLayer();
    const action = virtualWindow(layer, {
      offsetY: 400,
      scrollTop: 520,
      pinned: true,
    });

    action.update({ offsetY: 800, scrollTop: 900, pinned: true });
    expect(layer.style.transform).toBe("translateY(-100px)");

    action.update({ offsetY: 800, scrollTop: 900, pinned: false });
    expect(layer.style.transform).toBe("translateY(800px)");
    expect(layer.style.position).toBe("");
    expect(layer.style.top).toBe("");
    expect(layer.style.height).toBe("");
    expect(layer.hasAttribute(PINNED_WINDOW_ATTRIBUTE)).toBe(false);
  });
});

describe("syncPinnedWindow", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("moves a pinned window to a scroll position written before a render", () => {
    const { container, layer } = buildLayer();
    virtualWindow(layer, { offsetY: 400, scrollTop: 520, pinned: true });

    syncPinnedWindow(container, 600);

    expect(layer.style.transform).toBe("translateY(-200px)");
  });

  it("leaves an unpinned window alone", () => {
    const { container, layer } = buildLayer();
    virtualWindow(layer, { offsetY: 400, scrollTop: 520 });

    syncPinnedWindow(container, 600);

    expect(layer.style.transform).toBe("translateY(400px)");
  });
});
