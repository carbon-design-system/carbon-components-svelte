import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import GraphCanvas from "./GraphCanvas.test.svelte";

const nodes = () =>
  Array.from(
    document.querySelectorAll<HTMLButtonElement>(".bx--viz-graph-canvas__node"),
  );
const stage = () =>
  document.querySelector<HTMLElement>(
    ".bx--viz-graph-canvas__stage",
  ) as HTMLElement;
const layer = () =>
  document.querySelector<HTMLElement>(
    ".bx--viz-graph-canvas__nodes",
  ) as HTMLElement;
const edges = () =>
  Array.from(document.querySelectorAll(".bx--viz-graph-canvas__edge"));

describe("GraphCanvas", () => {
  it("lays the nodes out as positioned buttons, one tab stop, with edges and a minimap", () => {
    render(GraphCanvas);

    expect(nodes().map((n) => n.textContent?.trim())).toEqual([
      "app",
      "api",
      "web",
      "postgres",
      "auth",
    ]);
    expect(nodes().map((n) => n.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    expect(nodes()[1].style.top).not.toBe(nodes()[0].style.top);
    expect(nodes()[0].style.width).toBe("160px");
    expect(nodes()[0]).toHaveAttribute("aria-label", "app, level 1, expanded");
    expect(edges()).toHaveLength(5);
    expect(
      document.querySelectorAll(".bx--viz-graph-canvas__minimap-node"),
    ).toHaveLength(5);
    expect(screen.getByRole("group", { name: "Service map" })).toBe(layer());
    const items = within(screen.getByTestId("canvas"))
      .getAllByRole("listitem", { hidden: true })
      .map((li) => li.textContent?.replace(/\s+/g, " ").trim());
    expect(items).toContain("Edge: api to postgres");
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeInTheDocument();
  });

  it("applies a given view to both layers and reports zooming from the controls and keys", async () => {
    const ontransform = vi.fn();
    render(GraphCanvas, { transform: { k: 0.5, tx: 10, ty: 20 }, ontransform });

    expect(layer().style.transform).toBe("translate(10px, 20px) scale(0.5)");
    expect(
      document
        .querySelector(".bx--viz-graph-canvas__edges g")
        ?.getAttribute("transform"),
    ).toBe("translate(10 20) scale(0.5)");

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(ontransform).toHaveBeenLastCalledWith(
      expect.objectContaining({ k: 0.625 }),
    );
    expect(screen.getByTestId("transform")).toHaveTextContent(/^0\.625,/);

    nodes()[0].focus();
    await user.keyboard("-");
    expect(screen.getByTestId("transform")).toHaveTextContent(/^0\.5,/);
    await user.keyboard("0");
    expect(screen.getByTestId("transform")).toHaveTextContent("fit");
  });

  it("moves between nodes with the arrow keys, folds with Left and unfolds with Right, selects with Enter", async () => {
    const onhover = vi.fn();
    const ontoggle = vi.fn();
    const onselect = vi.fn();
    render(GraphCanvas, { onhover, ontoggle, onselect });

    nodes()[0].focus();
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "app" }),
    );
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(nodes()[1]);
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "api", rank: 1 }),
    );
    expect(
      edges().filter((e) =>
        e.classList.contains("bx--viz-graph-canvas__edge--active"),
      ),
    ).toHaveLength(3);
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "api, level 2, expanded",
    );

    await user.keyboard("{ArrowLeft}");
    expect(ontoggle).toHaveBeenCalledWith({ id: "api", collapsed: true });
    expect(screen.getByTestId("collapsed")).toHaveTextContent("api");
    expect(nodes().map((n) => n.textContent?.replace(/\s+/g, ""))).toEqual([
      "app",
      "api+1",
      "web",
      "auth",
    ]);
    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("collapsed")).toHaveTextContent("");

    await user.keyboard("{Enter}");
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({ node: expect.objectContaining({ id: "api" }) }),
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("api");
    expect(nodes()[1]).toHaveAttribute("aria-pressed", "true");
  });

  it("pans by dragging the stage floor but not a node, and colors nodes by group", async () => {
    const ontransform = vi.fn();
    render(GraphCanvas, {
      withGroups: true,
      transform: { k: 1, tx: 0, ty: 0 },
      ontransform,
    });

    const press = (target: Element, type: string, x: number, y: number) =>
      fireEvent(
        target,
        new MouseEvent(type, {
          clientX: x,
          clientY: y,
          button: 0,
          bubbles: true,
          cancelable: true,
        }),
      );
    press(nodes()[0], "pointerdown", 0, 0);
    press(nodes()[0], "pointermove", 40, 40);
    press(nodes()[0], "pointerup", 40, 40);
    await new Promise((r) => setTimeout(r, 30));
    expect(ontransform).not.toHaveBeenCalled();

    press(stage(), "pointerdown", 0, 0);
    press(stage(), "pointermove", 40, 30);
    press(stage(), "pointerup", 40, 30);
    await new Promise((r) => setTimeout(r, 30));
    expect(ontransform).toHaveBeenLastCalledWith({ k: 1, tx: 40, ty: 30 });

    expect(nodes()[0]).toHaveClass("bx--viz-graph-canvas__node--grouped");
    expect(nodes()[0].style.getPropertyValue("--bx-viz-color")).toBe(
      nodes()[2].style.getPropertyValue("--bx-viz-color"),
    );
  });
});
