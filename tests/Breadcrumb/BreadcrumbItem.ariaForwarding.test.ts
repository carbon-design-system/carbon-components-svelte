import { render, screen } from "@testing-library/svelte";
import BreadcrumbItemAria from "./BreadcrumbItem.ariaForwarding.test.svelte";

describe("BreadcrumbItem aria forwarding", () => {
  it("places a consumer aria-describedby on the link", () => {
    render(BreadcrumbItemAria, {
      props: { itemProps: { "aria-describedby": "extra-help" } },
    });

    const link = screen.getByRole("link", { name: "Reports" });
    expect(link).toHaveAttribute("aria-describedby", "extra-help");
    expect(link).toHaveAccessibleDescription("Extra help");
    expect(screen.getByTestId("item")).not.toHaveAttribute("aria-describedby");
  });

  it("names the link with a consumer aria-labelledby", () => {
    render(BreadcrumbItemAria, {
      props: { itemProps: { "aria-labelledby": "external-name" } },
    });

    expect(
      screen.getByRole("link", { name: "External name" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("item")).not.toHaveAttribute("aria-labelledby");
  });

  it("names the link with a consumer aria-label", () => {
    render(BreadcrumbItemAria, {
      props: { itemProps: { "aria-label": "Consumer label" } },
    });

    expect(
      screen.getByRole("link", { name: "Consumer label" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("item")).not.toHaveAttribute("aria-label");
  });

  it("keeps the attributes on the item when there is no href", () => {
    render(BreadcrumbItemAria, {
      props: {
        href: "",
        itemProps: { "aria-describedby": "extra-help" },
      },
    });

    expect(screen.getByTestId("item")).toHaveAttribute(
      "aria-describedby",
      "extra-help",
    );
  });
});
