import { fireEvent, render, screen } from "@testing-library/svelte";
import ImageViewer from "carbon-components-svelte/ImageViewer/ImageViewer.svelte";
import { tick } from "svelte";

/** A 2000 x 1000 picture in a 500 x 400 frame, so fit is 0.25. */
const props = {
  src: "/picture.png",
  alt: "A picture",
  width: 2000,
  height: 1000,
};

const frame = () => screen.getByRole("img", { name: "A picture" });
const layer = (container: HTMLElement) =>
  container.querySelector<HTMLElement>(".bx--image-viewer__layer");
const transform = (container: HTMLElement) => layer(container)?.style.transform;

describe("ImageViewer", () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 500,
      bottom: 400,
      width: 500,
      height: 400,
      toJSON() {},
    });
    // The shared observer would report the setup file's zero-width mock.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("is a focusable image region named by its alt text, with a keyboard hint", () => {
    render(ImageViewer, { props });

    const region = frame();
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toHaveAttribute("aria-roledescription", "zoomable image");
    const hint = document.getElementById(
      region.getAttribute("aria-describedby") ?? "",
    );
    expect(hint).toHaveTextContent(/Plus and minus zoom/);
  });

  it("fits the image in the frame", () => {
    const { container } = render(ImageViewer, { props });

    expect(transform(container)).toBe("translate(0px, 75px) scale(0.25)");
    expect(
      screen.getByRole("button", { name: "Actual size" }),
    ).toHaveTextContent("25%");
  });

  it("zooms with + and -, resets with 0, and toggles actual size with Enter", async () => {
    const { container } = render(ImageViewer, { props });

    await fireEvent.keyDown(frame(), { key: "+" });
    expect(transform(container)).toContain("scale(0.375)");
    await fireEvent.keyDown(frame(), { key: "-" });
    expect(transform(container)).toContain("scale(0.25)");

    await fireEvent.keyDown(frame(), { key: "Enter" });
    expect(transform(container)).toContain("scale(1)");
    await fireEvent.keyDown(frame(), { key: "0" });
    expect(transform(container)).toBe("translate(0px, 75px) scale(0.25)");
  });

  it("pans a zoomed image with the arrow keys, and leaves them alone at fit", async () => {
    const { container } = render(ImageViewer, { props });

    const atFit = await fireEvent.keyDown(frame(), { key: "ArrowRight" });
    expect(atFit).toBe(true);

    await fireEvent.keyDown(frame(), { key: "Enter" });
    // Zoomed to 100%, centered on the frame's center.
    expect(transform(container)).toBe("translate(-750px, -300px) scale(1)");
    const panned = await fireEvent.keyDown(frame(), { key: "ArrowLeft" });
    expect(panned).toBe(false);
    expect(transform(container)).toBe("translate(-690px, -300px) scale(1)");
  });

  it("zooms about the pointer with Ctrl and the wheel", async () => {
    const { container } = render(ImageViewer, { props });

    const event = await fireEvent.wheel(frame(), {
      deltaY: -100,
      ctrlKey: true,
      clientX: 100,
      clientY: 200,
    });

    expect(event).toBe(false);
    const match = transform(container)?.match(
      /translate\((.+)px, (.+)px\) scale\((.+)\)/,
    );
    const [x, y, scale] = (match ?? []).slice(1).map(Number);
    expect(scale).toBeGreaterThan(0.25);
    // The image point that was under the pointer still is.
    expect((100 - x) / scale).toBeCloseTo((100 - 0) / 0.25, 0);
    expect((200 - y) / scale).toBeCloseTo((200 - 75) / 0.25, 0);
  });

  it("leaves a plain wheel to the page unless asked to zoom", async () => {
    const { container, rerender } = render(ImageViewer, { props });

    expect(await fireEvent.wheel(frame(), { deltaY: -100 })).toBe(true);
    expect(transform(container)).toBe("translate(0px, 75px) scale(0.25)");

    await rerender({ ...props, wheel: "always" });
    expect(await fireEvent.wheel(frame(), { deltaY: -100 })).toBe(false);
    expect(transform(container)).not.toContain("scale(0.25)");
  });

  it("takes a starting zoom and follows later changes", async () => {
    const { container, rerender } = render(ImageViewer, {
      props: { ...props, zoom: 1 },
    });
    await tick();

    expect(transform(container)).toContain("scale(1)");
    await rerender({ ...props, zoom: "fit" });
    expect(transform(container)).toBe("translate(0px, 75px) scale(0.25)");
  });

  it("clamps the zoom to maxZoom", async () => {
    const { container } = render(ImageViewer, {
      props: { ...props, maxZoom: 2 },
    });

    for (let press = 0; press < 8; press++) {
      // biome-ignore lint/performance/noAwaitInLoops: one key at a time
      await fireEvent.keyDown(frame(), { key: "+" });
    }

    expect(transform(container)).toContain("scale(2)");
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled();
  });

  it("returns to fit when the source changes", async () => {
    const { container, rerender } = render(ImageViewer, { props });
    await fireEvent.keyDown(frame(), { key: "Enter" });

    await rerender({ ...props, src: "/other.png", width: 1000, height: 1000 });

    expect(transform(container)).toBe("translate(50px, 0px) scale(0.4)");
  });

  it("announces the zoom once it settles", async () => {
    vi.useFakeTimers();
    render(ImageViewer, { props });

    await fireEvent.keyDown(frame(), { key: "Enter" });
    expect(screen.getByRole("status").textContent?.trim()).toBe("");
    await vi.advanceTimersByTimeAsync(300);
    await tick();

    expect(screen.getByRole("status")).toHaveTextContent("Zoom 100%");
    vi.useRealTimers();
  });

  it("shows the message and a retry in a group, not a trapped image role", async () => {
    class FakeImage {
      static instances: FakeImage[] = [];
      src = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor() {
        FakeImage.instances.push(this);
      }
    }
    vi.stubGlobal("Image", FakeImage);
    render(ImageViewer, { props: { src: "/missing.png", alt: "Broken" } });
    expect(screen.getByRole("img", { name: "Broken" })).toBeInTheDocument();

    FakeImage.instances[0].onerror?.();
    await tick();

    const region = screen.getByRole("group", { name: "Broken" });
    expect(region).not.toHaveAttribute("tabindex");
    expect(region).toHaveTextContent("The image could not be loaded.");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(FakeImage.instances).toHaveLength(2);
  });
});
