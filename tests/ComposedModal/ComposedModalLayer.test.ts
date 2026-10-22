import { render, screen } from "@testing-library/svelte";
import ComposedModalLayerTest from "./ComposedModalLayer.test.svelte";

describe("ComposedModal Layer", () => {
  it("starts a Layer at level 0 and puts ModalBody on level 1", () => {
    render(ComposedModalLayerTest);
    expect(screen.getByTestId("modal")).toHaveClass(
      "bx--modal",
      "bx--layer-one",
    );
    expect(screen.getByTestId("body")).toHaveClass(
      "bx--modal-content",
      "bx--layer-two",
    );
  });

  // As in v11, the header and footer sit on the modal's level 0 and the
  // body on level 1, even when the modal renders inside a Layer.
  it.each([
    ["header-layer", "bx--layer-two"],
    ["footer-layer", "bx--layer-two"],
    ["body-layer", "bx--layer-three"],
  ])("puts a Layer in %s on %s", (testId, layerClass) => {
    render(ComposedModalLayerTest);
    expect(screen.getByTestId(testId)).toHaveClass(layerClass);
  });
});
