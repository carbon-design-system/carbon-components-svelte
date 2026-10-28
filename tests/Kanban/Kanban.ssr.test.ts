// @vitest-environment node
import { renderRaw, renderSSR } from "../utils/ssr";
import KanbanSsr from "./Kanban.ssr.test.svelte";

describe("Kanban server render", () => {
  it("renders columns, cards and the single tab stop without a browser", () => {
    const { document } = renderSSR(KanbanSsr, { id: "board" });
    const columns = [...document.querySelectorAll("[data-kanban-column]")];
    expect(
      columns.map((column) => column.getAttribute("data-kanban-column")),
    ).toEqual(["todo", "done"]);
    expect(document.querySelectorAll("[data-kanban-item]")).toHaveLength(3);
    const stops = [...document.querySelectorAll(".bx--kanban__handle")].filter(
      (handle) => handle.getAttribute("tabindex") === "0",
    );
    expect(stops.map((handle) => handle.getAttribute("aria-label"))).toEqual([
      "Alpha",
    ]);
  });

  it("derives inner ids from id, so markup is stable", () => {
    const props = { id: "board" };
    const html = renderRaw(KanbanSsr, props);
    expect(html).toBe(renderRaw(KanbanSsr, props));
    expect(html).toContain('id="board-instructions"');
    expect(html).toContain('aria-describedby="board-instructions"');
    expect(html).toContain('id="board-handle-a"');
  });

  it("builds a collapsed column's cards only once it opens", () => {
    const { document } = renderSSR(KanbanSsr, { collapsedColumns: ["done"] });
    expect(document.querySelectorAll("[data-kanban-item]")).toHaveLength(2);
    expect(document.querySelector('[data-kanban-column="done"]')).toHaveClass(
      "bx--kanban__column--collapsed",
    );
  });
});
