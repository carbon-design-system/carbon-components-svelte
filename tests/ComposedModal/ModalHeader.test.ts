import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ModalHeaderTest from "./ModalHeader.test.svelte";

describe("ModalHeader", () => {
  it("should render title", () => {
    render(ModalHeaderTest, {
      props: {
        title: "Modal Title",
      },
    });

    const title = screen.getByText("Modal Title");
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass("bx--modal-header__heading");
    expect(title).toHaveClass("bx--type-beta");
  });

  it("should render label", () => {
    render(ModalHeaderTest, {
      props: {
        label: "Modal Label",
      },
    });

    const label = screen.getByText("Modal Label");
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass("bx--modal-header__label");
    expect(label).toHaveClass("bx--type-delta");
  });

  it("should render close button", () => {
    render(ModalHeaderTest);

    const closeButton = screen.getByRole("button", { name: "Close" });
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveClass("bx--modal-close");
  });

  it("should hide close button when hideCloseButton is true", () => {
    render(ModalHeaderTest, {
      props: {
        title: "Forced choice",
        hideCloseButton: true,
      },
    });

    expect(
      screen.queryByRole("button", { name: "Close" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Forced choice")).toBeInTheDocument();
  });

  it("should handle custom icon description", () => {
    render(ModalHeaderTest, {
      props: {
        iconDescription: "Custom close text",
      },
    });

    const closeButton = screen.getByRole("button", {
      name: "Custom close text",
    });
    expect(closeButton).toBeInTheDocument();
  });

  it("should dispatch click event", async () => {
    const onclick = vi.fn();
    render(ModalHeaderTest, { props: { onclick } });

    const closeButton = screen.getByRole("button", { name: "Close" });
    await user.click(closeButton);

    expect(onclick).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      "labelClass",
      { label: "Test Label" },
      () => screen.getByText("Test Label"),
      "custom-label-class",
    ],
    [
      "titleClass",
      { title: "Test Title" },
      () => screen.getByText("Test Title"),
      "custom-title-class",
    ],
    [
      "closeClass",
      {},
      () => screen.getByRole("button", { name: "Close" }),
      "custom-close-class",
    ],
    [
      "closeIconClass",
      {},
      () =>
        screen
          .getByRole("button", { name: "Close" })
          .querySelector(".bx--modal-close__icon"),
      "custom-icon-class",
    ],
  ])("applies %s", (prop, props, getElement, className) => {
    render(ModalHeaderTest, { props: { ...props, [prop]: className } });

    expect(getElement()).toHaveClass(className);
  });

  it("should render slot content", () => {
    render(ModalHeaderTest, {
      props: {
        slotContent: "Custom header content",
      },
    });

    expect(screen.getByText("Custom header content")).toBeInTheDocument();
  });

  it.each([
    ["title", ".bx--modal-header__heading"],
    ["label", ".bx--modal-header__label"],
  ])("should not render %s when empty", (prop, selector) => {
    render(ModalHeaderTest, { props: { [prop]: "" } });

    const closeButton = screen.getByRole("button", { name: "Close" });
    const modalHeader = closeButton.closest(".bx--modal-header");
    expect(modalHeader?.querySelector(selector)).not.toBeInTheDocument();
  });
});
