import { render, screen } from "@testing-library/svelte";
import { isSvelte4, isSvelte5 } from "../setup-tests";
import ImageLoaderSvelte4 from "./ImageLoader.test.svelte";
import ImageLoaderSvelte5 from "./ImageLoader.svelte5.test.svelte";

const ImageLoader = isSvelte5 ? ImageLoaderSvelte5 : ImageLoaderSvelte4;

describe("ImageLoader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders with default props", () => {
    render(ImageLoader);
    const wrapper = screen.getByTestId("default-loader");
    const img = wrapper.querySelector("img");
    expect(img).toBeDefined();
  });

  it("shows loading state and transitions to loaded state", async () => {
    render(ImageLoader);

    const loadingIndicator = screen.getByTestId("loading-state");
    expect(loadingIndicator).toBeInTheDocument();

    const wrapper = screen.getByTestId("loader-with-slots");
    const img = wrapper.querySelector("img");
    expect(img).toBeDefined();
    if (img) {
      const loadEvent = new Event("load");
      img.dispatchEvent(loadEvent);

      expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
      expect(img).toBeVisible();
    }
  });

  it("handles error state correctly", async () => {
    render(ImageLoader);

    const wrapper = screen.getByTestId("error-loader");
    const img = wrapper.querySelector("img");
    expect(img).toBeDefined();

    if (img) {
      const errorEvent = new Event("error");
      img.dispatchEvent(errorEvent);

      const errorMessage = screen.getByTestId("error-message");
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent("Failed to load image");
    }
  });

  it("supports aspect ratio", () => {
    render(ImageLoader);

    const wrapper = screen.getByTestId("loader-with-ratio");
    const aspectRatioWrapper = wrapper.querySelector(
      "[class*='bx--aspect-ratio']",
    );

    expect(aspectRatioWrapper).toHaveClass("bx--aspect-ratio--16x9");
  });

  it("supports fade in animation", async () => {
    render(ImageLoader);

    const wrapper = screen.getByTestId("loader-with-fade");
    const img = wrapper.querySelector("img");
    expect(img).toBeDefined();

    if (img) {
      const loadEvent = new Event("load");
      img.dispatchEvent(loadEvent);

      expect(img).toHaveStyle({
        transition: expect.stringContaining("opacity"),
      });
    }
  });

  it("supports programmatic image loading", async () => {
    const { component } = render(ImageLoader);

    const wrapper = screen.getByTestId("programmatic-loader");
    const img = wrapper.querySelector("img");
    expect(img).toBeDefined();

    const imageLoaderComponent = component.imageLoader;
    expect(imageLoaderComponent).toBeDefined();

    const newSrc = "https://example.com/new-image.jpg";

    imageLoaderComponent.loadImage(newSrc);
    if (img) {
      expect(img.getAttribute("src")).toBe(newSrc);
    }
  });

  describe.skipIf(isSvelte5)("svelte 4", () => {
    it("dispatches load and error events", async () => {
      const { component } = render(ImageLoader);

      const load = vi.fn();
      const error = vi.fn();

      component.$on("load", load);
      component.$on("error", error);

      const defaultWrapper = screen.getByTestId("default-loader");
      const defaultImg = defaultWrapper.querySelector("img");
      expect(defaultImg).toBeDefined();

      if (defaultImg) {
        defaultImg.dispatchEvent(new Event("load"));
        expect(load).toHaveBeenCalled();
      }

      const errorWrapper = screen.getByTestId("error-loader");
      const errorImg = errorWrapper.querySelector("img");
      expect(errorImg).toBeDefined();

      if (errorImg) {
        errorImg.dispatchEvent(new Event("error"));
        expect(error).toHaveBeenCalled();
      }
    });
  });

  describe.skipIf(isSvelte4)("svelte 5", () => {
    it("dispatches load and error events", async () => {
      const load = vi.fn();
      const error = vi.fn();

      render(ImageLoader, { onload: load, onerror: error });

      const defaultWrapper = screen.getByTestId("default-loader");
      const defaultImg = defaultWrapper.querySelector("img");
      expect(defaultImg).toBeDefined();

      if (defaultImg) {
        defaultImg.dispatchEvent(new Event("load"));
        expect(load).toHaveBeenCalled();
      }

      const errorWrapper = screen.getByTestId("error-loader");
      const errorImg = errorWrapper.querySelector("img");
      expect(errorImg).toBeDefined();

      if (errorImg) {
        errorImg.dispatchEvent(new Event("error"));
        expect(error).toHaveBeenCalled();
      }
    });
  });
});
