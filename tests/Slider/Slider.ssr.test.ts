// @vitest-environment node
import Slider from "carbon-components-svelte/Slider/Slider.svelte";
import { render } from "svelte/server";

describe("Slider server render", () => {
  // `fullWidth && "100%"` rendered `style="width: false;"` when unset.
  it("sets no width unless fullWidth", () => {
    const { body } = render(Slider, { props: { labelText: "Volume" } });
    expect(body).not.toContain("width: false");
  });

  it("fills the width with fullWidth", () => {
    const { body } = render(Slider, {
      props: { labelText: "Volume", fullWidth: true },
    });
    expect(body).toContain("width: 100%");
  });
});
