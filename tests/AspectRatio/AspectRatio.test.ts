import { render, screen } from "@testing-library/svelte";
import AspectRatio from "./AspectRatio.test.svelte";

describe("AspectRatio", () => {
  it("renders correctly", () => {
    render(AspectRatio);

    for (const ratio of [
      "2x1",
      "2x3",
      "16x9",
      "4x3",
      "1x1",
      "3x4",
      "3x2",
      "9x16",
      "1x2",
    ]) {
      const boundingElement = screen.getByText(ratio).parentElement;
      expect(boundingElement).toHaveClass(`bx--aspect-ratio--${ratio}`);
    }
  });
});
