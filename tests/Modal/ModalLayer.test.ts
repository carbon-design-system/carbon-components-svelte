import { render, screen } from "@testing-library/svelte";
import ModalLayerTest from "./ModalLayer.test.svelte";

describe("Modal Layer", () => {
  it("starts a Layer at level 0 and puts the body on level 1", () => {
    render(ModalLayerTest);
    const modal = screen.getByTestId("modal");
    const body = modal.querySelector(".bx--modal-content");

    expect(modal).toHaveClass("bx--modal", "bx--layer-one");
    expect(body).toHaveClass("bx--layer-two");
    expect(modal.querySelector(".bx--modal-container")).not.toHaveClass(
      "bx--layer-one",
      "bx--layer-two",
    );
  });

  // The modal starts at level 0 even inside a Layer, as in v11.
  it("steps a Layer in the body up to level 2, capped there", () => {
    render(ModalLayerTest);
    expect(screen.getByTestId("body-layer")).toHaveClass("bx--layer-three");
    expect(screen.getByTestId("deeper-layer")).toHaveClass("bx--layer-three");
  });
});
