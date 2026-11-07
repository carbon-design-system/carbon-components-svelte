import { fireEvent, render, screen } from "@testing-library/svelte";
import ImageLoader from "carbon-components-svelte/ImageLoader/ImageLoader.svelte";
import { tick } from "svelte";
import ImageLoaderRetry from "./ImageLoaderRetry.test.svelte";
import { settlePreload, stubPreloader } from "./preloader";

/** The `<img>` the user sees: the hidden server-render `<img>` is excluded. */
const visibleImg = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("img")).find(
    (img) => img.style.display !== "none",
  );

describe("ImageLoader preload", () => {
  beforeEach(() => {
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
  });

  it("preloads and shows the same srcset and sizes", async () => {
    const preloads = stubPreloader();
    const { container } = render(ImageLoader, {
      props: {
        src: "photo.jpg",
        alt: "Photo",
        srcset: "photo-480.jpg 480w, photo-960.jpg 960w",
        sizes: "(min-width: 800px) 50vw, 100vw",
      },
    });

    expect(preloads).toHaveLength(1);
    expect(preloads[0]).toHaveAttribute(
      "srcset",
      "photo-480.jpg 480w, photo-960.jpg 960w",
    );
    expect(preloads[0]).toHaveAttribute(
      "sizes",
      "(min-width: 800px) 50vw, 100vw",
    );

    await settlePreload(preloads[0], "onload");

    const img = visibleImg(container);
    expect(img).toHaveAttribute(
      "srcset",
      "photo-480.jpg 480w, photo-960.jpg 960w",
    );
    expect(img).toHaveAttribute("sizes", "(min-width: 800px) 50vw, 100vw");
  });

  it("passes the attributes that change the request to the preload", () => {
    const preloads = stubPreloader();
    // Svelte 3's `img` types lack `fetchpriority`.
    const hints: Record<string, string> = { fetchpriority: "high" };
    render(ImageLoader, {
      props: {
        src: "photo.jpg",
        crossorigin: "use-credentials",
        referrerpolicy: "no-referrer",
        decoding: "async",
        ...hints,
      },
    });

    expect(preloads[0]).toHaveAttribute("crossorigin", "use-credentials");
    expect(preloads[0]).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(preloads[0]).toHaveAttribute("decoding", "async");
    expect(preloads[0]).toHaveAttribute("fetchpriority", "high");
  });

  it("preloads through a <picture> and shows the <source>s", async () => {
    const preloads = stubPreloader();
    const sources = [
      { srcset: "photo.avif", type: "image/avif" },
      {
        srcset: "photo-wide.webp",
        type: "image/webp",
        media: "(min-width: 800px)",
      },
    ];
    const { container } = render(ImageLoader, {
      props: { src: "photo.jpg", alt: "Photo", sources },
    });

    const picture = preloads[0].parentElement;
    expect(picture?.tagName).toBe("PICTURE");
    expect(
      Array.from(picture?.querySelectorAll("source") ?? []).map((s) =>
        s.getAttribute("srcset"),
      ),
    ).toEqual(["photo.avif", "photo-wide.webp"]);

    await settlePreload(preloads[0], "onload");

    const img = visibleImg(container);
    expect(img?.parentElement?.tagName).toBe("PICTURE");
    const shown = Array.from(
      img?.parentElement?.querySelectorAll("source") ?? [],
    );
    expect(shown.map((s) => s.getAttribute("media"))).toEqual([
      null,
      "(min-width: 800px)",
    ]);
    expect(shown.map((s) => s.getAttribute("type"))).toEqual([
      "image/avif",
      "image/webp",
    ]);
  });

  it("loads a URL set by loadImage() without srcset or sources", async () => {
    const preloads = stubPreloader();
    const { component, container } = render(ImageLoader, {
      props: {
        src: "photo.jpg",
        srcset: "photo-480.jpg 480w",
        sources: [{ srcset: "photo.avif", type: "image/avif" }],
      },
    });
    await settlePreload(preloads[0], "onload");

    component.loadImage("other.jpg");
    await tick();

    expect(preloads).toHaveLength(2);
    expect(preloads[1]).not.toHaveAttribute("srcset");
    expect(preloads[1].parentElement).toBeNull();
    await settlePreload(preloads[1], "onload");
    const img = visibleImg(container);
    expect(img).toHaveAttribute("src", "other.jpg");
    expect(img).not.toHaveAttribute("srcset");
    expect(container.querySelector("picture:not([style])")).toBeNull();
  });

  it("shows an image the document already has without the loading state", async () => {
    stubPreloader({ cached: true });
    const load = vi.fn();
    const { container } = render(ImageLoaderRetry, {
      props: { src: "cached.jpg", onload: load },
    });
    // Rendered loading first, as the server did.
    expect(screen.getByTestId("loading-state")).toBeInTheDocument();

    await tick();

    expect(screen.queryByTestId("loading-state")).not.toBeInTheDocument();
    expect(visibleImg(container)).toHaveAttribute("src", "cached.jpg");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("loads again from the error slot with retry", async () => {
    const preloads = stubPreloader();
    const { container } = render(ImageLoaderRetry, { props: { src: "a.jpg" } });
    await settlePreload(preloads[0], "onerror");

    await fireEvent.click(screen.getByTestId("retry"));

    expect(preloads).toHaveLength(2);
    expect(screen.queryByTestId("retry")).not.toBeInTheDocument();
    expect(screen.getByTestId("loading-state")).toBeInTheDocument();

    await settlePreload(preloads[1], "onload");

    expect(visibleImg(container)).toHaveAttribute("src", "a.jpg");
  });

  it("ignores the failed attempt settling after a retry", async () => {
    const preloads = stubPreloader();
    const { component, container } = render(ImageLoader, {
      props: { src: "a.jpg" },
    });
    await settlePreload(preloads[0], "onerror");

    component.retry();
    await settlePreload(preloads[0], "onerror");
    expect(visibleImg(container)).toBeUndefined();

    await settlePreload(preloads[1], "onload");
    expect(visibleImg(container)).toHaveAttribute("src", "a.jpg");
  });
});
