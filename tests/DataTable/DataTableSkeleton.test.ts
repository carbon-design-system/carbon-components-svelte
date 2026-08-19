import { render } from "@testing-library/svelte";
import { user } from "../utils/user";
import DataTableSkeleton from "./DataTableSkeleton.test.svelte";
import DataTableSkeletonEvents from "./DataTableSkeletonEvents.test.svelte";

describe("DataTableSkeleton", () => {
  it("renders skeleton state", () => {
    const { container } = render(DataTableSkeleton);

    const table = container.querySelector("table");
    expect(table).toBeInTheDocument();
    expect(table).toHaveClass("bx--skeleton", "bx--data-table");
  });

  it("renders with container wrapper", () => {
    const { container } = render(DataTableSkeleton);
    const wrapper = container.querySelector(".bx--data-table-container");
    expect(wrapper).toBeInTheDocument();
  });

  it("does not forward click but forwards mouse events on the table", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(DataTableSkeletonEvents);

    const table = container.querySelector("table");
    assert(table);

    await user.click(table);
    expect(consoleLog).not.toHaveBeenCalledWith("click");

    await user.hover(table);
    expect(consoleLog).toHaveBeenCalledWith("mouseover");

    await user.unhover(table);
    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });

  it("renders header section by default", () => {
    const { container } = render(DataTableSkeleton);
    const header = container.querySelector(".bx--data-table-header");
    expect(header).toBeInTheDocument();
  });

  it("renders toolbar section by default", () => {
    const { container } = render(DataTableSkeleton);
    const toolbar = container.querySelector(".bx--table-toolbar");
    expect(toolbar).toBeInTheDocument();
  });
});
