import { render, screen } from "@testing-library/svelte";
import AspectRatioTag from "./AspectRatio.tag.test.svelte";

describe("AspectRatio tag", () => {
  it("renders the configured tag for the outer element", () => {
    render(AspectRatioTag);

    expect(screen.getByTestId("section-ratio").tagName).toBe("SECTION");
  });

  it("defaults to a div when tag is not set", () => {
    render(AspectRatioTag);

    expect(screen.getByTestId("default-ratio").tagName).toBe("DIV");
  });
});
