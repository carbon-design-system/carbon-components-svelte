import { render, screen } from "@testing-library/svelte";
import ComposedModalTest from "../ComposedModal/ComposedModal.test.svelte";
import ModalTest from "./Modal.test.svelte";
import ModalLabelSlot from "./ModalLabelSlot.test.svelte";

describe("modal heading level", () => {
  it("renders the Modal label and heading as h2", () => {
    render(ModalTest, {
      props: {
        open: true,
        modalLabel: "Account settings",
        modalHeading: "Edit profile",
      },
    });

    expect(
      screen.getByRole("heading", { level: 2, name: "Edit profile" }),
    ).toHaveClass("bx--modal-header__heading");
    expect(
      screen.getByRole("heading", { level: 2, name: "Account settings" }),
    ).toHaveClass("bx--modal-header__label");
  });

  it("renders the label slot without modalLabel", () => {
    render(ModalLabelSlot);

    expect(
      screen.getByRole("heading", { level: 2, name: "Cloudant" }),
    ).toHaveClass("bx--modal-header__label");
  });

  it("renders the ModalHeader label and title as h2", () => {
    render(ComposedModalTest, {
      props: {
        open: true,
        headerLabel: "Account settings",
        headerTitle: "Edit profile",
      },
    });

    expect(
      screen.getByRole("heading", { level: 2, name: "Edit profile" }),
    ).toHaveClass("bx--modal-header__heading", "bx--type-beta");
    expect(
      screen.getByRole("heading", { level: 2, name: "Account settings" }),
    ).toHaveClass("bx--modal-header__label");
  });
});
