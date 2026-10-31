import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import StatusGrid from "./StatusGrid.test.svelte";

const pods = [
  { name: "api-1", state: "healthy" },
  { name: "api-2", state: "healthy" },
  { name: "api-3", state: "degraded" },
  { name: "db-1", state: "failed" },
];

describe("StatusGrid", () => {
  it("draws one cell per row in its state's color, counts states in the legend, and selects", async () => {
    const onselect = vi.fn();
    render(StatusGrid, { data: pods, selectable: true, onselect });

    const cells = document.querySelectorAll(".bx--viz-status-grid__cell");
    expect(cells).toHaveLength(4);
    expect(
      (cells[3] as HTMLElement).style.getPropertyValue("--bx-viz-color"),
    ).toContain("error");
    const legend = screen.getByRole("group", { name: "States" });
    expect(legend).toHaveTextContent(/Healthy\s*2/);
    expect(legend).toHaveTextContent(/Failed\s*1/);

    await user.click(screen.getByRole("button", { name: "db-1: Failed" }));
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "db-1", status: "failed" }),
    );
    expect(
      screen.getByRole("button", { name: "db-1: Failed" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
