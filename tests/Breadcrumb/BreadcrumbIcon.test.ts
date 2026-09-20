import { render, screen } from "@testing-library/svelte";
import BreadcrumbIcon from "./BreadcrumbIcon.test.svelte";

describe("BreadcrumbItem icon", () => {
  it("renders an icon from the icon prop inside the link's clickable region", () => {
    render(BreadcrumbIcon);

    const link = screen.getByText("Icon prop").closest("a.bx--link");
    assert(link);
    expect(
      link.querySelector(".bx--breadcrumb-item__icon svg"),
    ).toBeInTheDocument();
  });

  it("renders an icon from the icon slot inside the link's clickable region", () => {
    render(BreadcrumbIcon);

    const link = screen.getByText("Icon slot").closest("a.bx--link");
    assert(link);
    expect(
      link.querySelector(".bx--breadcrumb-item__icon svg"),
    ).toBeInTheDocument();
  });

  it("does not render an icon container when no icon is provided", () => {
    render(BreadcrumbIcon);

    const item = screen.getByText("No icon").closest(".bx--breadcrumb-item");
    expect(item).not.toBeNull();
    expect(item?.querySelector(".bx--breadcrumb-item__icon")).toBeNull();
  });

  it("scopes the sm icon sizing class to the breadcrumb's sm size", () => {
    render(BreadcrumbIcon, { props: { size: "sm" } });

    const nav = screen.getByRole("navigation");
    const list = nav.querySelector(".bx--breadcrumb");
    expect(list).toHaveClass("bx--breadcrumb--sm");

    const icon = screen
      .getByText("Icon prop")
      .closest(".bx--breadcrumb-item")
      ?.querySelector(".bx--breadcrumb-item__icon svg");
    expect(icon).toBeInTheDocument();
  });
});
