import { render, screen } from "@testing-library/svelte";
import BreadcrumbItemAria from "./BreadcrumbItem.ariaForwarding.test.svelte";

describe("BreadcrumbItem aria forwarding", () => {
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
