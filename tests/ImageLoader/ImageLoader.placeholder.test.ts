import { render } from "@testing-library/svelte";
import ImageLoader from "carbon-components-svelte/ImageLoader/ImageLoader.svelte";
import { isSvelte5 } from "../utils/svelte-version";
import { settlePreload, stubPreloader } from "./preloader";

const placeholderOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>(".bx--image-loader__placeholder");

const visibleImg = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("img")).find(
    (img) => img.style.display !== "none",
  );

describe("ImageLoader placeholder", () => {
  beforeEach(() => {
    if (!Element.prototype.animate) {
      Element.prototype.animate = function animate() {
        const animation = {
          currentTime: 0,
          onfinish: null as (() => void) | null,
          cancel() {},
          finish() {},
          pause() {},
          play() {},
        };
        queueMicrotask(() => animation.onfinish?.());
        return animation as unknown as Animation;
      };
    }
  });

  afterEach(() => {
    (Element.prototype as { animate?: unknown }).animate = undefined;
    vi.unstubAllGlobals();
  });

  it("fills the box with the skeleton color for true", () => {
    stubPreloader();
    const { container } = render(ImageLoader, {
      props: { src: "a.jpg", ratio: "16x9", placeholder: true },
    });

    const placeholder = placeholderOf(container);
    expect(placeholder).toHaveAttribute("aria-hidden", "true");
    expect(placeholder?.style.getPropertyValue("--ccs-image-placeholder")).toBe(
      "",
    );
    expect(placeholder).not.toHaveClass("bx--image-loader__placeholder--image");
  });

  it("paints a color placeholder", () => {
    stubPreloader();
    const { container } = render(ImageLoader, {
      props: { src: "a.jpg", ratio: "16x9", placeholder: "#8d8d8d" },
    });

    expect(
      placeholderOf(container)?.style.getPropertyValue(
        "--ccs-image-placeholder",
      ),
    ).toBe("#8d8d8d");
  });

  it.each([
    [
      "data:image/jpeg;base64,/9j/4AAQ",
      'url("data:image/jpeg;base64,/9j/4AAQ")',
    ],
    ["/lqip/a.jpg", 'url("/lqip/a.jpg")'],
    ['/a".jpg', 'url("/a\\22 .jpg")'],
  ])("blurs an image placeholder %s", (placeholder, expected) => {
    stubPreloader();
    const { container } = render(ImageLoader, {
      props: { src: "a.jpg", ratio: "16x9", placeholder },
    });

    const element = placeholderOf(container);
    expect(element).toHaveClass("bx--image-loader__placeholder--image");
    expect(element?.style.getPropertyValue("--ccs-image-placeholder")).toBe(
      expected,
    );
  });

  it("ignores a color that could end the declaration", () => {
    stubPreloader();
    const { container } = render(ImageLoader, {
      props: {
        src: "a.jpg",
        ratio: "16x9",
        placeholder: "red; background: url(//evil.test)",
      },
    });

    expect(
      placeholderOf(container)?.style.getPropertyValue(
        "--ccs-image-placeholder",
      ),
    ).toBe("");
  });

  it("needs a box: renders none without a ratio or dimensions", () => {
    stubPreloader();
    const { container } = render(ImageLoader, {
      props: { src: "a.jpg", placeholder: true },
    });

    expect(placeholderOf(container)).toBeNull();
  });

  it("uses width and height as the ratio", () => {
    stubPreloader();
    const { container } = render(ImageLoader, {
      props: { src: "a.jpg", width: 800, height: 600, placeholder: true },
    });

    const frame = container.querySelector<HTMLElement>(".bx--aspect-ratio");
    expect(frame).toHaveClass("bx--aspect-ratio--custom");
    expect(frame?.style.getPropertyValue("--ccs-aspect-ratio")).toBe("75.000%");
    expect(placeholderOf(container)).not.toBeNull();
  });

  it("prefers ratio over width and height", () => {
    stubPreloader();
    const { container } = render(ImageLoader, {
      props: { src: "a.jpg", ratio: "1x1", width: 800, height: 600 },
    });

    expect(container.querySelector(".bx--aspect-ratio")).toHaveClass(
      "bx--aspect-ratio--1x1",
    );
  });

  it("marks the placeholder done once the image loads", async () => {
    const preloads = stubPreloader();
    const { container } = render(ImageLoader, {
      props: { src: "a.jpg", ratio: "16x9", placeholder: true },
    });
    expect(placeholderOf(container)).not.toHaveClass(
      "bx--image-loader__placeholder--done",
    );

    await settlePreload(preloads[0], "onload");

    expect(placeholderOf(container)).toHaveClass(
      "bx--image-loader__placeholder--done",
    );
  });

  it("clears the placeholder on error too", async () => {
    const preloads = stubPreloader();
    const { container } = render(ImageLoader, {
      props: { src: "a.jpg", ratio: "16x9", placeholder: "#8d8d8d" },
    });

    await settlePreload(preloads[0], "onerror");

    expect(placeholderOf(container)).toHaveClass(
      "bx--image-loader__placeholder--done",
    );
  });

  it("fades the placeholder only with fadeIn", () => {
    stubPreloader();
    const { container, unmount } = render(ImageLoader, {
      props: { src: "a.jpg", ratio: "16x9", placeholder: true },
    });
    expect(placeholderOf(container)).not.toHaveClass(
      "bx--image-loader__placeholder--fade",
    );
    unmount();

    const faded = render(ImageLoader, {
      props: { src: "a.jpg", ratio: "16x9", placeholder: true, fadeIn: true },
    });
    expect(placeholderOf(faded.container)).toHaveClass(
      "bx--image-loader__placeholder--fade",
    );
  });

  // Svelte 4 and 3 run transitions as CSS animations, so only Svelte 5's
  // Web Animations calls expose the duration.
  it.skipIf(!isSvelte5)(
    "skips the fade when the user prefers reduced motion",
    async () => {
      vi.stubGlobal("matchMedia", (query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        addEventListener() {},
        removeEventListener() {},
      }));
      const durations: number[] = [];
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (
        this: Element,
        ...args: Parameters<Element["animate"]>
      ) {
        durations.push(Number((args[1] as KeyframeAnimationOptions).duration));
        return animate.apply(this, args);
      };
      const preloads = stubPreloader();
      const { container } = render(ImageLoader, {
        props: { src: "a.jpg", alt: "Logo", fadeIn: true },
      });

      await settlePreload(preloads[0], "onload");

      expect(visibleImg(container)).toBeTruthy();
      expect(durations.filter((duration) => duration > 0)).toEqual([]);
    },
  );
});

describe("ImageLoader fit and focal point", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const shown = async (props: Record<string, unknown>) => {
    const preloads = stubPreloader();
    const { container } = render(ImageLoader, {
      props: { src: "a.jpg", alt: "Photo", ratio: "16x9", ...props },
    });
    await settlePreload(preloads[0], "onload");
    return visibleImg(container) as HTMLElement;
  };

  it("leaves the image as it was without fit or focalPoint", async () => {
    const img = await shown({});

    expect(img).not.toHaveClass("bx--image-loader__img--fit");
    expect(img.style.getPropertyValue("--ccs-image-fit")).toBe("");
  });

  it("sets object-fit from fit", async () => {
    const img = await shown({ fit: "contain" });

    expect(img).toHaveClass("bx--image-loader__img--fit");
    expect(img.style.getPropertyValue("--ccs-image-fit")).toBe("contain");
  });

  it("crops to cover around focalPoint", async () => {
    const img = await shown({ focalPoint: "30% 20%" });

    expect(img.style.getPropertyValue("--ccs-image-fit")).toBe("cover");
    expect(img.style.getPropertyValue("--ccs-image-position")).toBe("30% 20%");
  });

  it("keeps an explicit fit beside focalPoint", async () => {
    const img = await shown({ fit: "contain", focalPoint: "left top" });

    expect(img.style.getPropertyValue("--ccs-image-fit")).toBe("contain");
    expect(img.style.getPropertyValue("--ccs-image-position")).toBe("left top");
  });

  it("drops a focalPoint that could end the declaration", async () => {
    const img = await shown({ focalPoint: "0 0; background: red" });

    expect(img.style.getPropertyValue("--ccs-image-position")).toBe("");
    expect(img).not.toHaveClass("bx--image-loader__img--fit");
  });

  it("keeps a consumer's inline object-fit", async () => {
    const img = await shown({ style: "object-fit: contain" });

    expect(img.style.objectFit).toBe("contain");
  });
});
