import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import DashboardGrid from "./DashboardGrid.test.svelte";

const status = () =>
  screen.getByTestId("grid").querySelector<HTMLElement>("[role=status]");

// The cell a widget has at a breakpoint, as the CSS reads it.
const cell = (testId: string, breakpoint: string) =>
  screen
    .getByTestId(testId)
    .style.getPropertyValue(`--ccs-dg-${breakpoint}`)
    .trim();

describe("DashboardGrid", () => {
  it("places each widget with custom properties for CSS grid", () => {
    render(DashboardGrid);

    // One layout at every breakpoint, so a single property carries it.
    expect(cell("a", "sm")).toBe("1 / 1 / span 2 / span 2");
    expect(cell("b", "sm")).toBe("1 / 3 / span 2 / span 2");
    expect(cell("a", "lg")).toBe("");
    expect(
      screen
        .getByTestId("grid")
        .style.getPropertyValue("--ccs-dashboard-grid-cols-lg"),
    ).toBe("4");
  });

  it("derives a layout for a breakpoint that has none", () => {
    render(DashboardGrid, {
      cols: { sm: 2, lg: 4 },
      layouts: {
        lg: [
          { id: "a", x: 0, y: 0, w: 4, h: 2 },
          { id: "b", x: 0, y: 2, w: 4, h: 2 },
        ],
      },
    });

    // Narrower, so `a` is 2 wide at sm and md, and lg keeps its own.
    expect(cell("a", "sm")).toBe("1 / 1 / span 2 / span 2");
    expect(cell("a", "md")).toBe("1 / 1 / span 2 / span 4");
    expect(cell("a", "lg")).toBe("");
  });

  it("gives a movable widget a named handle, and a static one none", () => {
    render(DashboardGrid);

    expect(screen.getByRole("button", { name: "Move Alpha" })).toHaveAttribute(
      "aria-describedby",
    );
    expect(screen.queryByRole("button", { name: "Move Gamma" })).toBeNull();
    expect(screen.getByTestId("c")).toHaveClass(
      "bx--dashboard-grid__item--static",
    );
  });

  it("renders no handle or edge when dragging and resizing are off", () => {
    render(DashboardGrid, { draggable: false, resizable: false });

    expect(screen.queryByRole("button", { name: "Move Alpha" })).toBeNull();
    expect(document.querySelector(".bx--dashboard-grid__resize")).toBeNull();
  });

  it("does not take a click inside the widget", async () => {
    render(DashboardGrid);

    await user.click(screen.getByRole("button", { name: "Inside" }));
    expect(screen.getByTestId("log")).toHaveTextContent("");
    expect(screen.getByTestId("a")).not.toHaveClass(
      "bx--dashboard-grid__item--placeholder",
    );
  });

  describe("keyboard", () => {
    it("announces a pick-up, a move that cannot happen, and a cancel", async () => {
      render(DashboardGrid);
      screen.getByRole("button", { name: "Move Alpha" }).focus();

      await user.keyboard("{Enter}");
      expect(status()).toHaveTextContent("Picked up Alpha, column 1, row 1.");

      // Alpha is at the top already.
      await user.keyboard("{ArrowUp}");
      expect(status()).toHaveTextContent(
        "Alpha cannot move any further that way.",
      );

      await user.keyboard("{Escape}");
      expect(status()).toHaveTextContent(
        "Cancelled. Alpha is back at column 1, row 1.",
      );
      expect(screen.getByTestId("log")).toHaveTextContent("");
    });

    it("moves a widget a column and commits it on Enter", async () => {
      render(DashboardGrid, {
        layout: [
          { id: "a", x: 0, y: 0, w: 2, h: 2 },
          { id: "b", x: 0, y: 2, w: 2, h: 2 },
          { id: "c", x: 2, y: 0, w: 1, h: 1 },
        ],
      });
      screen.getByRole("button", { name: "Move Alpha" }).focus();

      await user.keyboard("{Enter}{ArrowRight}");
      expect(status()).toHaveTextContent("Moved Alpha to column 2, row 1.");
      // Nothing is reported until the drop.
      expect(screen.getByTestId("log")).toHaveTextContent("");
      expect(screen.getByTestId("a").getAttribute("style")).toContain(
        "1 / 2 /",
      );

      await user.keyboard("{Enter}");
      expect(status()).toHaveTextContent("Dropped Alpha at column 2, row 1.");
      expect(screen.getByTestId("log").textContent).toMatch(
        /^move:keyboard:undefined:a:/,
      );
      expect(screen.getByTestId("log").textContent?.split("\n")).toHaveLength(
        1,
      );
    });

    it("resizes with Shift and the arrows", async () => {
      render(DashboardGrid);
      screen.getByRole("button", { name: "Move Alpha" }).focus();

      await user.keyboard("{Enter}{Shift>}{ArrowRight}{/Shift}");
      expect(status()).toHaveTextContent(
        "Resized Alpha to 3 columns wide, 2 rows high.",
      );
      await user.keyboard("{Enter}");
      expect(screen.getByTestId("log").textContent).toMatch(
        /^resize:keyboard:/,
      );
    });

    it("keeps the old layout when layoutchange is prevented", async () => {
      render(DashboardGrid, { prevent: true });
      screen.getByRole("button", { name: "Move Alpha" }).focus();

      await user.keyboard("{Enter}{Shift>}{ArrowRight}{/Shift}{Enter}");
      expect(screen.getByTestId("log").textContent).toMatch(
        /^resize:keyboard:/,
      );
      expect(cell("a", "sm")).toBe("1 / 1 / span 2 / span 2");
    });

    it("cancels a move when focus leaves the handle", async () => {
      render(DashboardGrid);
      screen.getByRole("button", { name: "Move Alpha" }).focus();

      await user.keyboard("{Enter}");
      await user.tab();
      expect(status()).toHaveTextContent(/^Cancelled\./);
      expect(screen.getByTestId("log")).toHaveTextContent("");
    });

    it("moves toward the inline end with the opposite arrow in RTL", async () => {
      render(DashboardGrid, { dir: "rtl" });
      screen.getByRole("button", { name: "Move Alpha" }).focus();

      await user.keyboard("{Enter}{ArrowLeft}");
      expect(status()).toHaveTextContent("Moved Alpha to column 2, row 1.");
    });
  });
});
