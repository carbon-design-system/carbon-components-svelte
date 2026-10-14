import { render, screen } from "@testing-library/svelte";
import Carousel from "carbon-components-svelte/Carousel/Carousel.svelte";

describe("Carousel consumer labelling", () => {
  it("lets a consumer aria-label name the carousel", () => {
    render(Carousel, { props: { "aria-label": "Featured products" } });

    expect(screen.getByRole("region")).toHaveAccessibleName(
      "Featured products",
    );
  });

  it("falls back to labelText", () => {
    render(Carousel);

    expect(screen.getByRole("region")).toHaveAccessibleName("Carousel");
  });
});
