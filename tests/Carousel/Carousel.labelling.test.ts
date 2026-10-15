import { render, screen } from "@testing-library/svelte";
import Carousel from "carbon-components-svelte/Carousel/Carousel.svelte";

describe("Carousel consumer labelling", () => {
  it("falls back to labelText", () => {
    render(Carousel);

    expect(screen.getByRole("region")).toHaveAccessibleName("Carousel");
  });
});
