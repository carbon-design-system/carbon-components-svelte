import { render, screen, waitFor, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import Gantt from "./Gantt.test.svelte";

type Change = {
  id: string;
  start: string | Date;
  end: string | Date;
  previous: { start: string | Date; end: string | Date };
  mode: string;
  source: string;
};
type Log = Array<{ name: string; detail: Change }>;

const bar = (id: string) =>
  document.querySelector(`[data-gantt-id="${id}"]`) as HTMLElement;
// ICU spaces the range dash with thin spaces; the version decides which.
const label = (id: string) =>
  bar(id)
    .getAttribute("aria-label")
    ?.replace(/[\u2009\u202f\u00a0]/g, " ");
const endCell = (id: string) =>
  document
    .querySelector(`[data-tree-row-id="${id}"]`)
    ?.querySelectorAll("td")[2];

describe("Gantt", () => {
  describe("structure", () => {
    it("pairs a treegrid with a named timeline", () => {
      render(Gantt);

      expect(
        screen.getByRole("treegrid", { name: "Plan" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("group", { name: "Timeline" }),
      ).toBeInTheDocument();
    });

    it("draws a bar for each scheduled visible row and none for the rest", () => {
      render(Gantt);

      expect(
        [...document.querySelectorAll("[data-gantt-id]")].map((node) =>
          node.getAttribute("data-gantt-id"),
        ),
      ).toEqual(["plan", "brief", "design", "go", "locked"]);
      expect(bar("plan")).toHaveClass("bx--gantt__bar--summary");
      expect(bar("go")).toHaveClass("bx--gantt__bar--milestone");
    });

    it("translates the default column headers, with English as the fallback", () => {
      render(Gantt, {
        props: {
          translateWithId: (id: string) =>
            id === "task" ? "Tarea" : id === "start" ? "Inicio" : undefined,
        },
      });

      expect(
        [...document.querySelectorAll("thead th")].map((th) =>
          th.textContent?.trim(),
        ),
      ).toEqual(["Tarea", "Inicio", "End"]);
    });

    it("draws no link between two tasks hidden under the same summary", () => {
      render(Gantt, { props: { expandedIds: [] } });

      expect(document.querySelectorAll("[data-gantt-id]")).toHaveLength(1);
      // Every link now joins the summary to itself, which draws nothing.
      expect(document.querySelectorAll(".bx--gantt__link")).toHaveLength(0);
    });

    it("marks a link whose successor starts before its predecessor ends", () => {
      render(Gantt);

      expect(document.querySelectorAll(".bx--gantt__link")).toHaveLength(3);
      expect(
        document.querySelectorAll(".bx--gantt__link--conflict"),
      ).toHaveLength(1);
    });

    it("draws the today line at the given day", () => {
      render(Gantt);

      expect(document.querySelector(".bx--gantt__today")).toBeInTheDocument();
    });

    it("hides the today line when set to false", () => {
      render(Gantt, { props: { today: false } });

      expect(document.querySelector(".bx--gantt__today")).toBeNull();
    });
  });

  describe("accessible names", () => {
    it("reads each bar's dates, progress and predecessors", () => {
      render(Gantt);

      expect(label("design")).toBe(
        "Design, Mar 9 – 13, 2026, 50% complete, after Brief, Go",
      );
      expect(label("go")).toBe("Go, milestone, Mar 16, 2026, after Design");
      expect(label("plan")).toBe(
        "Planning, summary, Mar 2 – 17, 2026, 68% complete",
      );
    });

    it("describes only the bars that can move", () => {
      render(Gantt);

      expect(bar("design")).toHaveAccessibleDescription(/Arrow keys move/);
      expect(bar("plan")).not.toHaveAttribute("aria-describedby");
      expect(bar("locked")).not.toHaveAttribute("aria-describedby");
    });
  });

  describe("keyboard", () => {
    it("is one tab stop across every bar", () => {
      render(Gantt);

      expect(
        document.querySelectorAll("[data-gantt-id][tabindex='0']"),
      ).toHaveLength(1);
    });

    it("moves between bars with the arrow keys", async () => {
      render(Gantt);

      bar("brief").focus();
      await user.keyboard("{ArrowDown}");
      expect(bar("design")).toHaveFocus();
      await user.keyboard("{End}");
      expect(bar("locked")).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      // The unscheduled last row has no bar.
      expect(bar("locked")).toHaveFocus();
      await user.keyboard("{Home}");
      expect(bar("plan")).toHaveFocus();
    });

    it("moves a task a day and rewrites its dates", async () => {
      const log: Log = [];
      render(Gantt, { props: { log } });

      bar("design").focus();
      await user.keyboard("{ArrowRight}");

      expect(log[0].detail).toMatchObject({
        id: "design",
        start: "2026-03-10",
        end: "2026-03-14",
        previous: { start: "2026-03-09", end: "2026-03-13" },
        mode: "move",
        source: "keyboard",
      });
      await waitFor(() =>
        expect(endCell("design")).toHaveTextContent("Mar 14, 2026"),
      );
      expect(label("design")).toContain("Mar 10 – 14, 2026");
    });

    it("resizes the end with Shift and the start with Alt and Shift", async () => {
      const log: Log = [];
      render(Gantt, { props: { log } });

      bar("design").focus();
      await user.keyboard("{Shift>}{ArrowLeft}{/Shift}");
      expect(log[0].detail).toMatchObject({ end: "2026-03-12", mode: "end" });
      await user.keyboard("{Alt>}{Shift>}{ArrowLeft}{/Shift}{/Alt}");
      expect(log[1].detail).toMatchObject({
        start: "2026-03-08",
        end: "2026-03-12",
        mode: "start",
      });
    });

    it("steps a week at a time when zoomed out to months", async () => {
      const log: Log = [];
      render(Gantt, { props: { log, zoom: "month" } });

      bar("design").focus();
      await user.keyboard("{ArrowRight}");

      expect(log[0].detail.start).toBe("2026-03-16");
    });

    it("keeps the dates when a listener cancels the change", async () => {
      render(Gantt, { props: { cancel: true } });

      bar("design").focus();
      await user.keyboard("{ArrowRight}");

      expect(endCell("design")).toHaveTextContent("Mar 13, 2026");
    });

    it("does not move a summary, a locked task or any task when readonly", async () => {
      const log: Log = [];
      const { rerender } = render(Gantt, { props: { log } });

      bar("plan").focus();
      await user.keyboard("{ArrowRight}");
      bar("locked").focus();
      await user.keyboard("{ArrowRight}");
      expect(log).toHaveLength(0);

      await rerender({ log, readonly: true });
      bar("design").focus();
      await user.keyboard("{ArrowRight}");
      expect(log).toHaveLength(0);
    });

    it("does not resize a milestone", async () => {
      const log: Log = [];
      render(Gantt, { props: { log } });

      bar("go").focus();
      await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
      expect(log).toHaveLength(0);
      await user.keyboard("{ArrowRight}");
      expect(log[0].detail.mode).toBe("move");
    });

    it("selects the task's row with Enter", async () => {
      render(Gantt);

      bar("brief").focus();
      await user.keyboard("{Enter}");

      await waitFor(() =>
        expect(
          document.querySelector('[data-tree-row-id="brief"]'),
        ).toHaveAttribute("aria-selected", "true"),
      );
      expect(bar("brief")).toHaveClass("bx--gantt__bar--selected");
    });
  });

  describe("dates", () => {
    it("writes back Date objects when the task holds them", async () => {
      const log: Log = [];
      render(Gantt, {
        props: {
          log,
          tasks: [
            {
              id: "d",
              text: "Dated",
              start: new Date(2026, 2, 9),
              end: new Date(2026, 2, 11),
            },
          ],
          expandedIds: [],
        },
      });

      bar("d").focus();
      await user.keyboard("{ArrowRight}");

      const { start, end } = log[0].detail;
      expect(start).toBeInstanceOf(Date);
      expect([(start as Date).getDate(), (end as Date).getDate()]).toEqual([
        10, 12,
      ]);
    });
  });

  describe("right-to-left", () => {
    it("swaps the arrow keys so Left moves a task later", async () => {
      const log: Log = [];
      render(Gantt, { props: { log, dir: "rtl" } });

      bar("design").focus();
      await user.keyboard("{ArrowLeft}");
      expect(log[0].detail.start).toBe("2026-03-10");
      await user.keyboard("{ArrowRight}");
      expect(log[1].detail.start).toBe("2026-03-09");
    });
  });

  describe("list", () => {
    it("shows a summary's derived dates in the Start and End columns", () => {
      render(Gantt);

      const row = within(
        document.querySelector('[data-tree-row-id="plan"]') as HTMLElement,
      );
      expect(row.getByText("Mar 2, 2026")).toBeInTheDocument();
      expect(row.getByText("Mar 17, 2026")).toBeInTheDocument();
    });
  });
});
