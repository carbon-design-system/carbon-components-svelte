import { render, screen } from "@testing-library/svelte";
import ImageLoaderComponent from "carbon-components-svelte/ImageLoader/ImageLoader.svelte";
import { tick } from "svelte";
import ImageLoader from "./ImageLoader.test.svelte";

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

  it("renders only a hidden <img> while loading", () => {
    render(ImageLoader);

    const wrapper = screen.getByTestId("default-loader");
    const imgs = wrapper.querySelectorAll("img");

    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toHaveAttribute("src", validImageSrc);
    expect(imgs[0]).toHaveStyle({ display: "none" });
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

  it("supports fade in", async () => {
    render(ImageLoader);

    const wrapper = screen.getByTestId("loader-with-fade");
    await settle(validImageSrc, "onload");

    expect(visibleImg(wrapper)).toHaveAttribute("src", validImageSrc);
  });

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
    let trigger: ((isIntersecting: boolean) => void) | undefined;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          trigger = (isIntersecting) =>
            callback(
              [{ isIntersecting, target: sentinel } as never],
              this as never,
            );
        }
        observe() {}
        unobserve() {}
      },
    );
    let sentinel: Element | null = null;
    const { container } = render(ImageLoaderComponent, {
      props: { src: validImageSrc, alt: "Logo", lazy: true },
    });
    sentinel = container.querySelector("span[aria-hidden]");

    expect(FakeImage.instances).toHaveLength(0);
    expect(container.querySelector("img")).toHaveAttribute("loading", "lazy");

    trigger?.(false);
    await tick();
    expect(FakeImage.instances).toHaveLength(0);

    trigger?.(true);
    await tick();
    expect(FakeImage.instances.map((image) => image.src)).toEqual([
      validImageSrc,
    ]);
    expect(container.querySelector("span[aria-hidden]")).toBeNull();
  });
});
