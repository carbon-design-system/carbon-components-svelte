import { render, screen } from "@testing-library/svelte";
import AccordionItemAria from "./AccordionItem.ariaForwarding.test.svelte";

describe("AccordionItem aria forwarding", () => {
  it("places a consumer aria-describedby on the heading button", () => {
    render(AccordionItemAria, {
      props: { itemProps: { "aria-describedby": "extra-help" } },
    });

    const button = screen.getByRole("button", { name: "Section" });
    expect(button).toHaveAttribute("aria-describedby", "extra-help");
    expect(button).toHaveAccessibleDescription("Extra help");
    expect(screen.getByTestId("item")).not.toHaveAttribute("aria-describedby");
  });

  it("names the heading button with a consumer aria-labelledby", () => {
    render(AccordionItemAria, {
      props: { itemProps: { "aria-labelledby": "external-name" } },
    });

    expect(
      screen.getByRole("button", { name: "External name" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("item")).not.toHaveAttribute("aria-labelledby");
  });

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
