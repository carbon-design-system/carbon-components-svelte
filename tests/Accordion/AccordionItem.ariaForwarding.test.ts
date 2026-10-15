import { render, screen } from "@testing-library/svelte";
import AccordionItemAria from "./AccordionItem.ariaForwarding.test.svelte";

describe("AccordionItem aria forwarding", () => {
  it("lets a consumer aria-label win over the ariaLabel prop", () => {
    render(AccordionItemAria, {
      props: {
        itemProps: { ariaLabel: "Prop label", "aria-label": "Consumer label" },
      },
    });

    expect(
      screen.getByRole("button", { name: "Consumer label" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("item")).not.toHaveAttribute("aria-label");
  });

  it("keeps the ariaLabel prop when no consumer aria-label is set", () => {
    render(AccordionItemAria, {
      props: { itemProps: { ariaLabel: "Prop label" } },
    });

    expect(
      screen.getByRole("button", { name: "Prop label" }),
    ).toBeInTheDocument();
  });
});
