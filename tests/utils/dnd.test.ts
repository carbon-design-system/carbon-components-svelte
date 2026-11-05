import { closestEdge } from "../../src/utils/dnd-math.js";
import { createTexts, DND_DEFAULT_TEXTS } from "../../src/utils/dnd-text.js";
import { createDnd } from "../../src/utils/dnd.js";
import type { DndPosition, DndZone } from "../../src/utils/dnd.js";

// A zone that is not a list: a panel with four edges to dock a tab to. It is
// the whole adapter a dock layout would need from the engine.
type EdgePosition = DndPosition & { edge: string };

const EDGES = ["left", "top", "right", "bottom"];

function dockZone(node: HTMLElement, onDrop: (edge: string) => boolean) {
  const at = (edge: string): EdgePosition => ({
    zone,
    key: `edge:${edge}`,
    edge,
  });
  const text = createTexts(
    {
      ...DND_DEFAULT_TEXTS,
      pickedUp: "Picked up {label}.",
      moved: "{label} is back.",
      movedEdge: "{label} docks {edge}.",
      dropped: "Dropped {label}.",
      droppedEdge: "Docked {label} {edge}.",
      cancelled: "Cancelled {label}.",
    },
    () => undefined,
  );
  const zone: DndZone = {
    node,
    name: "dock",
    disabled: false,
    orientation: "horizontal",
    rtl: () => false,
    text,
    sourceAt: (target, via) =>
      via === "keyboard" && target.matches("button")
        ? {
            item: target as HTMLElement,
            label: target.textContent ?? "",
            index: 0,
          }
        : null,
    home: () => ({ zone, key: "home" }),
    collide: (x, y) =>
      at(closestEdge({ left: 0, top: 0, right: 100, bottom: 100 }, x, y)),
    step(_s, from, intent) {
      const i = EDGES.indexOf((from as EdgePosition).edge);
      if (intent === "forward") return at(EDGES[(i + 1) % EDGES.length]);
      if (intent === "back")
        return at(EDGES[(i + EDGES.length - 1) % EDGES.length]);
      return null;
    },
    describe: (_s, p) => ({
      position: 1,
      count: 1,
      name: "dock",
      edge: (p as EdgePosition).edge ?? "",
      variant: p.key === "home" ? "" : "Edge",
    }),
    indicate: () => true,
    commit: (_s, p) => onDrop((p as EdgePosition).edge),
    scrollers: () => [],
    invalidate() {},
  };
  return zone;
}

const status = () =>
  document.querySelector("[role='status']")?.textContent?.replace(/​/g, "");

function press(target: Element, key: string) {
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
  );
}

describe("createDnd", () => {
  const cleanups: Array<() => void> = [];

  function setup(onDrop: (edge: string) => boolean = () => true) {
    const node = document.createElement("div");
    const button = document.createElement("button");
    button.textContent = "main.tf";
    node.append(button);
    document.body.append(node);
    const dnd = createDnd();
    const zone = dockZone(node, onDrop);
    const connection = dnd.connect(zone);
    cleanups.push(() => connection.destroy());
    button.focus();
    return { dnd, button };
  }

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
    document.body.innerHTML = "";
  });

  it("drives a zone that is not a list: lift, step, drop", () => {
    const drops: string[] = [];
    const { dnd, button } = setup((edge) => {
      drops.push(edge);
      return true;
    });

    press(button, " ");
    expect(dnd.session?.via).toBe("keyboard");
    expect(status()).toBe("Picked up main.tf.");
    press(button, "ArrowRight");
    press(button, "ArrowRight");
    expect(status()).toBe("main.tf docks top.");
    press(button, " ");

    expect(drops).toEqual(["top"]);
    expect(status()).toBe("Docked main.tf top.");
    expect(dnd.session).toBeNull();
  });

  it("takes the announcement variant from the zone", () => {
    const { button } = setup();
    press(button, "Enter");
    press(button, "ArrowRight");
    expect(status()).toBe("main.tf docks left.");
  });

  it("repeats the position at the end of the path instead of staying silent", () => {
    const { button } = setup();
    press(button, " ");
    press(button, "Home");
    expect(status()).toBe("main.tf is back.");
  });

  it("cancels with Escape and drops nothing", () => {
    const onDrop = vi.fn(() => true);
    const { dnd, button } = setup(onDrop);
    press(button, " ");
    press(button, "ArrowRight");
    press(document.body, "Escape");

    expect(onDrop).not.toHaveBeenCalled();
    expect(dnd.session).toBeNull();
    expect(status()).toBe("Cancelled main.tf.");
  });

  it("treats a refused commit as a cancel", () => {
    const { button } = setup(() => false);
    press(button, " ");
    press(button, "ArrowRight");
    press(button, " ");

    expect(status()).toBe("Cancelled main.tf.");
  });

  it("drops in place without committing", () => {
    const onDrop = vi.fn(() => true);
    const { button } = setup(onDrop);
    press(button, " ");
    press(button, " ");

    expect(onDrop).not.toHaveBeenCalled();
    expect(status()).toBe("Dropped main.tf.");
  });

  it("lets go of the lifted item when the zone is destroyed", () => {
    const { dnd, button } = setup();
    press(button, " ");
    expect(document.querySelector("[data-dnd-lifted]")).not.toBeNull();

    for (const cleanup of cleanups.splice(0)) cleanup();

    expect(dnd.session).toBeNull();
    expect(document.querySelector("[data-dnd-lifted]")).toBeNull();
    expect(document.querySelector(".bx--dnd__indicator")).toBeNull();
  });

  it("keeps a second engine's session apart", () => {
    const first = setup();
    press(first.button, " ");
    const other = createDnd();
    expect(other.session).toBeNull();
  });
});
