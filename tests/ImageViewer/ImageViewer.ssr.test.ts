// @vitest-environment node
import ImageViewer from "carbon-components-svelte/ImageViewer/ImageViewer.svelte";
import { renderSSR } from "../utils/ssr";

describe("ImageViewer server render", () => {
  it("renders the named image region and the skeleton, without a transform", () => {
    const { document } = renderSSR(ImageViewer, {
      src: "/picture.png",
      alt: "A picture",
      ratio: "16x9",
    });

    const region = document.querySelector('[role="img"]');
    expect(region).toHaveAttribute("aria-label", "A picture");
    expect(region).toHaveAttribute("tabindex", "0");
    expect(document.querySelector(".bx--skeleton__placeholder")).not.toBeNull();
    expect(
      document.querySelector<HTMLElement>(".bx--image-viewer__layer")?.style
        .transform,
    ).toBe("");
  });

  it("disables the zoom buttons until the image has loaded", () => {
    const { document } = renderSSR(ImageViewer, {
      src: "/picture.png",
      alt: "A picture",
    });

    const buttons = [...document.querySelectorAll("button")];
    expect(buttons).toHaveLength(3);
    for (const button of buttons) expect(button).toBeDisabled();
  });
});
