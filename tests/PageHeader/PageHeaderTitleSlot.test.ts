import { render, screen } from "@testing-library/svelte";
import PageHeaderTitleSlot from "./PageHeaderTitleSlot.test.svelte";

describe("PageHeader titleChildren slot", () => {
  it("renders slotted title content inside the heading, over the prop", () => {
    render(PageHeaderTitleSlot);

    const heading = screen
      .getByTestId("slotted")
      .querySelector(".bx--page-header__title");
    expect(heading?.tagName).toBe("H1");
    expect(heading).toContainElement(screen.getByTestId("count"));
    expect(heading).toHaveTextContent("Databases (4)");
    expect(screen.queryByText("Fallback")).not.toBeInTheDocument();
  });

  it("renders the heading from the slot alone, without a title prop", () => {
    render(PageHeaderTitleSlot);

    expect(
      screen.getByRole("heading", { name: "Slot only" }),
    ).toBeInTheDocument();
  });

  it.each([
    ["start-only", "title-start", "start"],
    ["end-only", "title-end", "end"],
  ])("renders %s content without a title", (header, className, content) => {
    render(PageHeaderTitleSlot);

    const root = screen.getByTestId(header);
    expect(
      root.querySelector(`.bx--page-header__${className}`),
    ).toContainElement(screen.getByTestId(content));
    expect(root.querySelector(".bx--page-header__title")).toBeNull();
  });
});
