import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import NodeEditor from "./NodeEditor.test.svelte";

const nodes = () =>
  Array.from(document.querySelectorAll<HTMLElement>(".bx--viz-editor__node"));
const edges = () =>
  Array.from(document.querySelectorAll(".bx--viz-editor__edge"));
const out = (id: string) => screen.getByTestId(id).textContent?.trim();
const pointer = (
  target: Element,
  type: string,
  x: number,
  y: number,
  extra: MouseEventInit = {},
) =>
  fireEvent(
    target,
    new MouseEvent(type, {
      clientX: x,
      clientY: y,
      button: 0,
      bubbles: true,
      cancelable: true,
      ...extra,
    }),
  );
const settle = () => new Promise((r) => setTimeout(r, 30));

describe("NodeEditor", () => {
  it("places nodes from their rows with ports, draws edges between ports, and lists both", () => {
    render(NodeEditor);

    expect(nodes().map((n) => n.textContent?.trim())).toEqual([
      "source",
      "map",
      "sink",
    ]);
    expect(nodes()[1].style.left).toBe("240px");
    expect(nodes()[0].querySelectorAll(".bx--viz-editor__port")).toHaveLength(
      2,
    );
    expect(edges()).toHaveLength(1);
    expect(
      edges()[0].querySelector(".bx--viz-editor__edge-line")?.getAttribute("d"),
    ).toMatch(/^M160,24L/);
    expect(nodes().map((n) => n.tabIndex)).toEqual([0, -1, -1]);
  });

  it("moves a dragged node on the snap grid as one undo step, and undoes it", async () => {
    const onmove = vi.fn();
    const onchange = vi.fn();
    render(NodeEditor, { onmove, onchange });

    await pointer(nodes()[1], "pointerdown", 0, 0);
    await pointer(nodes()[1], "pointermove", 21, 10);
    await pointer(nodes()[1], "pointermove", 35, 12);
    await pointer(nodes()[1], "pointerup", 35, 12);
    // 21 and 35 snap to 24 and 32 across; 12 snaps to 16 down.
    expect(out("nodes")).toBe("src@0,0 map@272,16 sink@480,0");
    expect(onmove).toHaveBeenCalledTimes(2);
    expect(onchange).toHaveBeenCalledTimes(2);
    const first = nodes()[1];
    expect(first.classList.contains("bx--viz-editor__node--dragging")).toBe(
      false,
    );

    nodes()[1].focus();
    await user.keyboard("{Control>}z{/Control}");
    expect(out("nodes")).toBe("src@0,0 map@240,0 sink@480,0");
    await user.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");
    expect(out("nodes")).toBe("src@0,0 map@272,16 sink@480,0");
  });

  it("connects with the keyboard, refuses through the cancelable event, and never duplicates", async () => {
    const onconnect = vi.fn();
    const { rerender } = render(NodeEditor, { onconnect });

    nodes()[1].focus();
    await user.keyboard("c");
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "connecting from map",
    );
    expect(document.querySelector(".bx--viz-editor__link")).not.toBeNull();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(nodes()[2]);
    await user.keyboard("{Enter}");
    expect(onconnect).toHaveBeenCalledWith({
      source: "map",
      target: "sink",
      sourcePort: "out",
      targetPort: "in",
    });
    expect(out("edges")).toBe("src>map map>sink");
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "connected map to sink",
    );
    expect(document.querySelector(".bx--viz-editor__link")).toBeNull();

    // The same connection again adds nothing.
    nodes()[1].focus();
    await user.keyboard("c{ArrowRight}{Enter}");
    expect(out("edges")).toBe("src>map map>sink");

    await rerender({ onconnect, refuse: "src" });
    nodes()[2].focus();
    await user.keyboard("c{Home}{Enter}");
    expect(out("edges")).toBe("src>map map>sink");
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "not allowed",
    );
  });

  it("selects by click and shift-click, nudges the selection with shift-arrows, and removes it with Delete", async () => {
    const onremove = vi.fn();
    const onselect = vi.fn();
    render(NodeEditor, { onremove, onselect });

    await user.click(nodes()[0]);
    expect(out("selected")).toBe("src");
    await user.keyboard("{Shift>}");
    await user.click(nodes()[1]);
    await user.keyboard("{/Shift}");
    expect(onselect).toHaveBeenLastCalledWith({
      nodes: ["src", "map"],
      edges: [],
    });
    expect(nodes()[0]).toHaveAttribute("aria-pressed", "true");

    nodes()[1].focus();
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
    expect(out("nodes")).toBe("src@0,8 map@240,8 sink@480,0");

    await user.keyboard("{Delete}");
    await settle();
    expect(out("nodes")).toBe("sink@480,0");
    expect(out("edges")).toBe("");
    expect(onremove).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: [
          expect.objectContaining({ id: "src" }),
          expect.objectContaining({ id: "map" }),
        ],
      }),
    );
    expect(out("selected")).toBe("");

    await user.keyboard("{Control>}z{/Control}");
    expect(out("nodes")).toBe("src@0,8 map@240,8 sink@480,0");
    expect(out("edges")).toBe("src>map");
  });

  it("selects an edge by clicking its hit path and removes it", async () => {
    render(NodeEditor);

    await fireEvent.click(
      document.querySelector(".bx--viz-editor__edge-hit") as Element,
    );
    expect(edges()[0]).toHaveClass("bx--viz-editor__edge--selected");
    await user.click(screen.getByRole("button", { name: "Remove selected" }));
    expect(out("edges")).toBe("");
    expect(out("nodes")).toBe("src@0,0 map@240,0 sink@480,0");
  });

  it("sweeps a marquee with shift and a drag on the floor", async () => {
    const onselect = vi.fn();
    render(NodeEditor, { onselect });
    const stage = document.querySelector(
      ".bx--viz-editor__stage",
    ) as HTMLElement;
    stage.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 800,
        height: 400,
        right: 800,
        bottom: 400,
        x: 0,
        y: 0,
        toJSON() {},
      }) as DOMRect;

    await pointer(stage, "pointerdown", 10, 10, { shiftKey: true });
    await pointer(stage, "pointermove", 300, 100, { shiftKey: true });
    expect(document.querySelector(".bx--viz-editor__marquee")).not.toBeNull();
    await pointer(stage, "pointerup", 300, 100, { shiftKey: true });
    expect(onselect).toHaveBeenLastCalledWith({
      nodes: ["src", "map"],
      edges: [],
    });
    expect(document.querySelector(".bx--viz-editor__marquee")).toBeNull();
  });

  it("arranges the graph in ranks from the controls, as one undoable step", async () => {
    render(NodeEditor, {
      nodes: [
        { id: "a", name: "a", x: 500, y: 300 },
        { id: "b", name: "b", x: 0, y: 0 },
      ],
      edges: [{ source: "a", target: "b" }],
    });
    await user.click(screen.getByRole("button", { name: "Arrange" }));
    const [a, b] =
      out("nodes")
        ?.split(" ")
        .map((s) => s.split("@")[1].split(",").map(Number)) ?? [];
    expect(a[0]).toBeLessThan(b[0]);
    expect(a[1]).toBe(b[1]);
    nodes()[0].focus();
    await user.keyboard("{Control>}z{/Control}");
    expect(out("nodes")).toBe("a@500,300 b@0,0");
  });

  it("gives edges that share a port separate channels, routes a backward edge around, and can curve", async () => {
    const { rerender } = render(NodeEditor, {
      nodes: [
        { id: "a", name: "a", x: 0, y: 0 },
        { id: "b", name: "b", x: 0, y: 200 },
        { id: "c", name: "c", x: 300, y: 100 },
        { id: "d", name: "d", x: -300, y: 100 },
      ],
      edges: [
        { source: "a", target: "c" },
        { source: "b", target: "c" },
        { source: "c", target: "d" },
      ],
    });
    const paths = () =>
      Array.from(document.querySelectorAll(".bx--viz-editor__edge-line")).map(
        (p) => p.getAttribute("d") ?? "",
      );
    // The two edges into c turn at different x, five pixels either side of
    // the midpoint; the turn is the first rounded corner.
    const channel = (d: string) => Number(d.match(/Q([\d.-]+),/)?.[1]);
    expect(channel(paths()[0])).toBe(225);
    expect(channel(paths()[1])).toBe(235);
    // The backward edge climbs to a lane above the nodes and comes around,
    // never crossing back through c or d.
    expect(paths()[2]).toContain(",84L");
    expect(paths()[2]).toContain("L-308,84");
    await rerender({
      nodes: [
        { id: "a", name: "a", x: 0, y: 0 },
        { id: "c", name: "c", x: 300, y: 100 },
      ],
      edges: [{ source: "a", target: "c" }],
      edge: "curved",
    });
    expect(paths()[0]).toMatch(/^M[\d.]+,[\d.]+C/);
  });

  it("does not pan the stage when a node is clicked, only when focus comes from the keyboard", async () => {
    const ontransform = vi.fn();
    render(NodeEditor, {
      nodes: [
        { id: "a", name: "a", x: 0, y: 0 },
        { id: "far", name: "far", x: 5000, y: 5000 },
      ],
      edges: [],
      ontransform,
    });
    const stage = document.querySelector(
      ".bx--viz-editor__stage",
    ) as HTMLElement;
    Object.defineProperty(stage, "clientWidth", {
      value: 600,
      configurable: true,
    });
    await user.click(nodes()[1]);
    expect(ontransform).not.toHaveBeenCalled();
  });

  it("is inert when readonly", async () => {
    render(NodeEditor, { readonly: true });
    expect(screen.queryByRole("button", { name: "Arrange" })).toBeNull();
    expect(
      document.querySelectorAll(".bx--viz-editor__port--out"),
    ).toHaveLength(0);
    await pointer(nodes()[1], "pointerdown", 0, 0);
    await pointer(nodes()[1], "pointermove", 40, 40);
    await pointer(nodes()[1], "pointerup", 40, 40);
    expect(out("nodes")).toBe("src@0,0 map@240,0 sink@480,0");
    nodes()[1].focus();
    await user.keyboard("{Delete}");
    await settle();
    expect(out("nodes")).toBe("src@0,0 map@240,0 sink@480,0");
  });
});
