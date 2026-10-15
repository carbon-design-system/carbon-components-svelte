import { render, screen } from "@testing-library/svelte";
import Modal from "carbon-components-svelte/Modal/Modal.svelte";

describe("Modal aria forwarding", () => {
  beforeEach(() => {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<span id="extra-help">Extra help</span><span id="ext-label">External label</span>',
    );
  });

  afterEach(() => {
    document.getElementById("extra-help")?.remove();
    document.getElementById("ext-label")?.remove();
  });

  it("joins a consumer aria-describedby after the alert body on the dialog", () => {
    const { container } = render(Modal, {
      props: {
        open: true,
        alert: true,
        modalHeading: "Delete",
        id: "m1",
        "aria-describedby": "extra-help",
      },
    });

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
    expect(dialog).toHaveAttribute(
      "aria-describedby",
      "bx--modal-body--m1 extra-help",
    );
    expect(dialog).toHaveAccessibleDescription(/Extra help$/);
    expect(
      container.querySelector(".bx--modal[role='presentation']"),
    ).not.toHaveAttribute("aria-describedby");
  });

  it("places a consumer aria-describedby on a non-alert dialog", () => {
    render(Modal, {
      props: {
        open: true,
        modalHeading: "Heading",
        "aria-describedby": "extra-help",
      },
    });

    expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
      "Extra help",
    );
  });

  it("names the dialog from a consumer aria-labelledby", () => {
    const { container } = render(Modal, {
      props: {
        open: true,
        modalHeading: "Heading",
        "aria-labelledby": "ext-label",
      },
    });

    expect(screen.getByRole("dialog")).toHaveAccessibleName("External label");
    expect(
      container.querySelector(".bx--modal[role='presentation']"),
    ).not.toHaveAttribute("aria-labelledby");
  });

  it("keeps naming the dialog from a consumer aria-label", () => {
    const { container } = render(Modal, {
      props: { open: true, modalHeading: "Heading", "aria-label": "Custom" },
    });

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Custom");
    expect(
      container.querySelector(".bx--modal[role='presentation']"),
    ).not.toHaveAttribute("aria-label");
  });

  it("prefers a consumer aria-label over modalLabel and keeps it off the region", () => {
    render(Modal, {
      props: {
        open: true,
        modalLabel: "Account",
        modalHeading: "Terms",
        hasScrollingContent: true,
        "aria-label": "Custom",
      },
    });

    expect(screen.getByRole("dialog")).toHaveAccessibleName("Custom");
    expect(screen.getByRole("region")).toHaveAttribute("aria-label", "Account");
  });
});
