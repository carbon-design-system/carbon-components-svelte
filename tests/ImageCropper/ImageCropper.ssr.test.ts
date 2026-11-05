// @vitest-environment node
import ImageCropper from "carbon-components-svelte/ImageCropper/ImageCropper.svelte";
import { renderSSR } from "../utils/ssr";

describe("ImageCropper server render", () => {
  it("renders the loading stage and no controls, and touches no browser global", () => {
    const { document } = renderSSR(ImageCropper, { src: "/photo.jpg" });

    const stage = document.querySelector('[role="group"]');
    expect(stage).toHaveAttribute("aria-label", "Crop image");
    expect(stage).toHaveClass("bx--skeleton");
    // Nothing to operate until an image has decoded in the browser.
    expect(stage).not.toHaveAttribute("tabindex");
    expect(document.querySelectorAll("button")).toHaveLength(0);
    expect(document.querySelector(".bx--image-cropper")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("renders an empty stage without a source", () => {
    const { document } = renderSSR(ImageCropper, {});

    expect(document.querySelector(".bx--skeleton")).toBeNull();
    expect(document.querySelector(".bx--image-cropper")).not.toHaveAttribute(
      "aria-busy",
    );
  });
});
