import { render, screen } from "@testing-library/svelte";
import ContainedListHideLabelAction from "./ContainedList.hideLabel.action.test.svelte";
import ContainedList from "./ContainedList.test.svelte";

describe("ContainedList hideLabel", () => {
  it("should render the header bar by default", () => {
    const { container } = render(ContainedList);

    const header = container.querySelector(".bx--contained-list__header");
    expect(header).not.toBeNull();
  });

  it("should not render the header bar when hideLabel is true", () => {
    const { container } = render(ContainedList, {
      props: { hideLabel: true },
    });

    const header = container.querySelector(".bx--contained-list__header");
    expect(header).toBeNull();
  });

  it("should still resolve the accessible name when hideLabel is true", () => {
    render(ContainedList, {
      props: { hideLabel: true, labelText: "List title" },
    });

    const list = screen.getByRole("list");
    expect(list).toHaveAccessibleName("List title");
  });

  it("should keep the header bar and only hide the label text when an action slot is used", () => {
    const { container } = render(ContainedListHideLabelAction);

    const header = container.querySelector(".bx--contained-list__header");
    expect(header).not.toBeNull();

    const label = container.querySelector(".bx--contained-list__label");
    expect(label).toHaveClass("bx--visually-hidden");

    const list = screen.getByRole("list");
    expect(list).toHaveAccessibleName("List title");
  });
});
