// @vitest-environment node
import AnnotatedImage from "carbon-components-svelte/AnnotatedImage/AnnotatedImage.svelte";
import { renderSSR } from "../utils/ssr";

describe("AnnotatedImage server render", () => {
  it("renders the image and its pins in place, with no script", () => {
    const { document } = renderSSR(AnnotatedImage, {
      src: "/phone.png",
      alt: "A phone",
      width: 1200,
      height: 800,
      legend: "end",
      pins: [
        { id: "a", x: 30, y: 60, label: "Battery" },
        { id: "b", x: 70, y: 25, label: "Camera" },
      ],
    });

    const img = document.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/phone.png");
    expect(img?.getAttribute("alt")).toBe("A phone");

    const anchors = document.querySelectorAll(".bx--annotated-image__anchor");
    expect(anchors).toHaveLength(2);
    expect((anchors[0] as HTMLElement).getAttribute("style")).toContain(
      "left: 30%",
    );
    expect((anchors[0] as HTMLElement).getAttribute("style")).toContain(
      "top: 60%",
    );
    expect(
      document.querySelector(".bx--annotated-image__pin")?.textContent,
    ).toMatch(/1\s+Battery/);
    expect(
      document.querySelectorAll(".bx--annotated-image__legend li"),
    ).toHaveLength(2);
    // Closed popovers are not in the page.
    expect(document.querySelector(".bx--popover--open")).toBeNull();
  });

  it("derives the box from the natural size, so it needs no layout script", () => {
    const { document } = renderSSR(AnnotatedImage, {
      src: "/phone.png",
      alt: "",
      width: 1200,
      height: 800,
      ratio: "1x1",
      focalPoint: { x: 0, y: 100 },
      pins: [],
    });
    const frame = document.querySelector(".bx--annotated-image__frame");
    const style = frame?.getAttribute("style") ?? "";
    expect(style).toContain("--ccs-annotated-image-aspect: 1.5");
    expect(style).toContain("--ccs-annotated-image-focal-x: 0");
    expect(style).toContain("--ccs-annotated-image-focal-y: 1");
  });
});
