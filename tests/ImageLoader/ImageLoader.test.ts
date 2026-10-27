import { render, screen } from "@testing-library/svelte";
import ImageLoaderComponent from "carbon-components-svelte/ImageLoader/ImageLoader.svelte";
import { tick } from "svelte";
import { stubIntersectionObserver } from "../utils/intersection-observer-mock";
import { isSvelte5 } from "../utils/svelte-version";
import ImageLoader from "./ImageLoader.test.svelte";
import ImageLoaderLazyToggle from "./ImageLoaderLazyToggle.test.svelte";

const validImageSrc =
  "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg";

/** Stand-in for `new Image()`: jsdom never loads images, so tests settle them by hand. */
class FakeImage {
  static instances: FakeImage[] = [];
  src = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    FakeImage.instances.push(this);
  }
}

/** Settle every preload started for `src`. */
const settle = async (src: string, outcome: "onload" | "onerror") => {
  for (const image of FakeImage.instances) {
    if (image.src === src) image[outcome]?.();
  }
  await tick();
};

/** The `<img>` the user sees: the hidden server-render `<img>` is excluded. */
const visibleImg = (wrapper: HTMLElement) =>
  Array.from(wrapper.querySelectorAll("img")).find(
    (img) => img.style.display !== "none",
  );

describe("ImageLoader", () => {
  beforeEach(() => {
    FakeImage.instances = [];
    vi.stubGlobal("Image", FakeImage);

    // Svelte 5 runs `transition:fade` through the Web Animations API, which jsdom lacks.
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
    vi.restoreAllMocks();
  });

  it("shows the loading slot, then the image once loaded", async () => {
    render(ImageLoader);

    const wrapper = screen.getByTestId("loader-with-slots");
    expect(screen.getByTestId("loading-state")).toBeInTheDocument();
    expect(visibleImg(wrapper)).toBeUndefined();

    await settle(validImageSrc, "onload");

    expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
    const img = visibleImg(wrapper);
    expect(img).toBeVisible();
    expect(img).toHaveAttribute("src", validImageSrc);
    expect(img).toHaveAttribute("alt", "IBM Logo with slots");
    expect(wrapper.querySelectorAll("img")).toHaveLength(1);
  });

  it("shows the error slot and no image on error", async () => {
    render(ImageLoader);

    const wrapper = screen.getByTestId("error-loader");
    await settle("https://invalid-url/nonexistent.png", "onerror");

    expect(screen.getByTestId("error-message")).toHaveTextContent(
      "Failed to load image",
    );
    expect(wrapper.querySelector("img")).toBeNull();
  });

  it("supports aspect ratio", async () => {
    render(ImageLoader);

    const wrapper = screen.getByTestId("loader-with-ratio");
    expect(wrapper.querySelector("[class*='bx--aspect-ratio']")).toHaveClass(
      "bx--aspect-ratio--16x9",
    );

    await settle(validImageSrc, "onload");

    const aspectRatio = wrapper.querySelector("[class*='bx--aspect-ratio']");
    expect(aspectRatio?.querySelector("img")).toHaveAttribute(
      "src",
      validImageSrc,
    );
  });

  // Svelte 4 and 3 run transitions as CSS animations, so only Svelte 5's
  // Web Animations calls expose the duration.
  it.skipIf(!isSvelte5)("fades the image in only with fadeIn", async () => {
    const durations: number[] = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (
      this: Element,
      ...args: Parameters<Element["animate"]>
    ) {
      durations.push(Number((args[1] as KeyframeAnimationOptions).duration));
      return animate.apply(this, args);
    };

    const { container, rerender } = render(ImageLoaderComponent, {
      props: { src: validImageSrc, alt: "Logo", fadeIn: false },
    });
    await settle(validImageSrc, "onload");
    expect(visibleImg(container)).toHaveAttribute("src", validImageSrc);
    expect(durations.filter((duration) => duration > 0)).toEqual([]);

    await rerender({ src: "", fadeIn: true });
    await rerender({ src: validImageSrc });
    await settle(validImageSrc, "onload");
    expect(visibleImg(container)).toHaveAttribute("src", validImageSrc);
    expect(durations.some((duration) => duration > 0)).toBe(true);
  });

  it.skipIf(!isSvelte5)(
    "transition takes precedence over fadeIn, with token durations",
    async () => {
      const animate = vi.spyOn(Element.prototype, "animate");
      const durations = () =>
        animate.mock.calls
          .map(([, options]) =>
            Number((options as KeyframeAnimationOptions).duration),
          )
          .filter((duration) => duration > 0);

      const { container, rerender } = render(ImageLoaderComponent, {
        props: {
          src: validImageSrc,
          alt: "Logo",
          fadeIn: true,
          transition: false,
        },
      });
      await settle(validImageSrc, "onload");
      expect(visibleImg(container)).toHaveAttribute("src", validImageSrc);
      expect(durations()).toEqual([]);

      await rerender({
        src: "",
        fadeIn: false,
        transition: { duration: "moderate02" },
      });
      await rerender({ src: validImageSrc });
      await settle(validImageSrc, "onload");
      expect(durations()).toContain(240);
    },
  );

  it("supports programmatic image loading", async () => {
    const { component } = render(ImageLoader);
    await tick();
    assert(component.imageLoader);

    const wrapper = screen.getByTestId("programmatic-loader");
    expect(wrapper.querySelector("img")).toBeNull();

    const newSrc = "https://example.com/new-image.jpg";
    component.imageLoader.loadImage(newSrc);

    expect(FakeImage.instances.some((image) => image.src === newSrc)).toBe(
      true,
    );

    await settle(newSrc, "onload");

    expect(wrapper.querySelector("img")).toHaveAttribute("src", newSrc);
  });

  it("ignores a superseded image settling after src changes", async () => {
    const { container, rerender } = render(ImageLoaderComponent, {
      props: { src: "a.jpg", alt: "Logo" },
    });
    await rerender({ src: "b.jpg" });

    await settle("a.jpg", "onload");
    expect(visibleImg(container)).toBeUndefined();

    await settle("a.jpg", "onerror");
    expect(container.querySelector("img")).toHaveAttribute("src", "b.jpg");
  });

  it("shows the loading slot again when src changes after a load", async () => {
    const { container, rerender } = render(ImageLoaderLazyToggle, {
      props: { src: "a.jpg" },
    });
    await settle("a.jpg", "onload");
    expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();

    await rerender({ src: "b.jpg" });

    expect(screen.getByTestId("loading-state")).toBeInTheDocument();
    expect(visibleImg(container)).toBeUndefined();
  });

  it("resets to idle when src is cleared", async () => {
    const { container, rerender } = render(ImageLoaderLazyToggle, {
      props: { src: validImageSrc },
    });
    await settle(validImageSrc, "onload");
    expect(visibleImg(container)).toBeTruthy();

    await rerender({ src: "" });

    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
  });

  it.each(["onload", "onerror"] as const)(
    "clears the previous result when src changes after %s",
    async (outcome) => {
      const { container, rerender } = render(ImageLoaderLazyToggle, {
        props: { src: "a.jpg" },
      });
      await settle("a.jpg", outcome);
      expect(
        outcome === "onload"
          ? visibleImg(container)
          : screen.queryByTestId("error-state"),
      ).toBeTruthy();

      await rerender({ src: "b.jpg" });

      expect(screen.queryByTestId("error-state")).not.toBeInTheDocument();
      expect(visibleImg(container)).toBeUndefined();
    },
  );

  it("shows the error slot inside the aspect ratio", async () => {
    const { container } = render(ImageLoaderLazyToggle, {
      props: { src: "a.jpg", ratio: "16x9" },
    });
    await settle("a.jpg", "onerror");

    const aspectRatio = container.querySelector(".bx--aspect-ratio");
    assert(aspectRatio);
    expect(
      aspectRatio.querySelector('[data-testid="error-state"]'),
    ).toBeInTheDocument();
  });

  it("stops observing the viewport on unmount", () => {
    const { instances } = stubIntersectionObserver();
    const { unmount } = render(ImageLoaderComponent, {
      props: { src: validImageSrc, lazy: true },
    });
    expect(instances[0].elements.size).toBe(1);

    unmount();

    expect(instances[0].elements.size).toBe(0);
  });

  it("dispatches load when the image loads", async () => {
    const load = vi.fn();
    const error = vi.fn();

    render(ImageLoader, { props: { onload: load, onerror: error } });
    await settle(validImageSrc, "onload");

    expect(load).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
  });

  it("dispatches error when the image fails to load", async () => {
    const load = vi.fn();
    const error = vi.fn();

    render(ImageLoader, { props: { onload: load, onerror: error } });
    await settle(validImageSrc, "onerror");

    expect(error).toHaveBeenCalledTimes(1);
    expect(load).not.toHaveBeenCalled();
  });

  it("waits for the viewport before loading with lazy", async () => {
    const { instances } = stubIntersectionObserver();
    const { container } = render(ImageLoaderComponent, {
      props: { src: validImageSrc, alt: "Logo", lazy: true },
    });
    const sentinel = container.querySelector("span[aria-hidden]");
    assert(sentinel);
    const trigger = (isIntersecting: boolean) =>
      instances[0].trigger(sentinel, isIntersecting);

    expect(FakeImage.instances).toHaveLength(0);
    expect(container.querySelector("img")).toHaveAttribute("loading", "lazy");

    trigger(false);
    await tick();
    expect(FakeImage.instances).toHaveLength(0);

    trigger(true);
    await tick();
    expect(FakeImage.instances.map((image) => image.src)).toEqual([
      validImageSrc,
    ]);
    expect(container.querySelector("span[aria-hidden]")).toBeNull();
  });

  it.each([
    [undefined, "600px"],
    ["1200px", "1200px"],
  ])("observes with rootMargin %s in lazy mode", (rootMargin, expected) => {
    const { instances } = stubIntersectionObserver();
    render(ImageLoaderComponent, {
      props: { src: validImageSrc, lazy: true, rootMargin },
    });

    expect(instances.map((instance) => instance.options)).toEqual([
      { rootMargin: expected, threshold: 0 },
    ]);
  });

  it("doesn't reload a loaded image when lazy turns on", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { component, container } = render(ImageLoaderLazyToggle, {
      props: { src: validImageSrc },
    });
    await settle(validImageSrc, "onload");
    expect(FakeImage.instances).toHaveLength(1);

    component.lazy = true;
    await tick();
    await tick();
    expect(FakeImage.instances).toHaveLength(1);
    expect(visibleImg(container)).toBeTruthy();
  });
});
