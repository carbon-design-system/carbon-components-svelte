import { render, screen } from "@testing-library/svelte";
import ComposedModalAria from "./ComposedModal.ariaForwarding.test.svelte";

describe("ComposedModal aria forwarding", () => {
  it("joins a consumer aria-describedby after the ModalBody id on an alertdialog", () => {
    const { container } = render(ComposedModalAria, {
      props: { alert: true, "aria-describedby": "extra-help" },
    });

    const dialog = screen.getByRole("alertdialog");
    const body = container.querySelector(".bx--modal-content");
    expect(dialog).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
    expect(dialog).toHaveAttribute(
      "aria-describedby",
      `${body?.id} extra-help`,
    );
    expect(dialog).toHaveAccessibleDescription("Body text Extra help");
    expect(
      container.querySelector(".bx--modal[role='presentation']"),
    ).not.toHaveAttribute("aria-describedby");
  });

  it("places a consumer aria-describedby on a non-alert dialog", () => {
    render(ComposedModalAria, {
      props: { "aria-describedby": "extra-help" },
    });

    expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
      "Extra help",
    );
  });

  it("names the dialog from a consumer aria-labelledby", () => {
    const { container } = render(ComposedModalAria, {
      props: { "aria-labelledby": "ext-label" },
    });

    expect(screen.getByRole("dialog")).toHaveAccessibleName("External label");
    expect(
      container.querySelector(".bx--modal[role='presentation']"),
    ).not.toHaveAttribute("aria-labelledby");
  });

  it("names the dialog from a consumer aria-label", () => {
    const { container } = render(ComposedModalAria, {
      props: { "aria-label": "Custom" },
    });

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Custom");
    expect(
      container.querySelector(".bx--modal[role='presentation']"),
    ).not.toHaveAttribute("aria-label");
  });
});
