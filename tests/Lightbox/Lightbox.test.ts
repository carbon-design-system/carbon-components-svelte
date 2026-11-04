import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import Lightbox from "./Lightbox.test.svelte";

const shownIndex = () => screen.getByTestId("index").textContent;
const dialog = () => screen.getByRole("dialog", { name: "Product photos" });
const option = (name: string) => screen.getByRole("option", { name });

describe("Lightbox", () => {
  let requested: string[];

  beforeEach(() => {
    requested = [];
    // jsdom never loads images, so record what the lightbox asks for.
    vi.stubGlobal(
      "Image",
      class {
        decoding = "";
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(value: string) {
          requested.push(value);
        }
      },
    );
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
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute("dir");
  });

  it("is a dialog described as an image gallery, with its position and caption", () => {
    render(Lightbox);

    expect(dialog()).toHaveAttribute("aria-roledescription", "image gallery");
    expect(within(dialog()).getByText("Image 1 of 4")).toBeInTheDocument();
    expect(within(dialog()).getByText("Caption 1 (1)")).toBeInTheDocument();
  });

  it("steps with the buttons and disables them at the ends", async () => {
    render(Lightbox);

    const previous = screen.getByRole("button", { name: "Previous image" });
    const next = screen.getByRole("button", { name: "Next image" });
    expect(previous).toBeDisabled();
    await fireEvent.click(next);
    expect(shownIndex()).toBe("1");
    expect(previous).toBeEnabled();
    await fireEvent.click(next);
    await fireEvent.click(next);
    expect(shownIndex()).toBe("3");
    expect(next).toBeDisabled();
    expect(screen.getByTestId("changes")).toHaveTextContent("1,2,3");
  });

  it("wraps around with loop", async () => {
    render(Lightbox, { props: { loop: true } });

    await fireEvent.click(
      screen.getByRole("button", { name: "Previous image" }),
    );
    expect(shownIndex()).toBe("3");
    await fireEvent.click(screen.getByRole("button", { name: "Next image" }));
    expect(shownIndex()).toBe("0");
  });

  it("moves with the arrow keys, Home and End when the image is fit", async () => {
    render(Lightbox);

    await fireEvent.keyDown(dialog(), { key: "ArrowRight" });
    await fireEvent.keyDown(dialog(), { key: "ArrowRight" });
    expect(shownIndex()).toBe("2");
    await fireEvent.keyDown(dialog(), { key: "ArrowLeft" });
    expect(shownIndex()).toBe("1");
    await fireEvent.keyDown(dialog(), { key: "End" });
    expect(shownIndex()).toBe("3");
    await fireEvent.keyDown(dialog(), { key: "Home" });
    expect(shownIndex()).toBe("0");
  });

  it("swaps the arrow keys in a right-to-left page", async () => {
    document.documentElement.setAttribute("dir", "rtl");
    render(Lightbox, { props: { index: 1 } });

    await fireEvent.keyDown(dialog(), { key: "ArrowLeft" });
    expect(shownIndex()).toBe("2");
    await fireEvent.keyDown(dialog(), { key: "ArrowRight" });
    expect(shownIndex()).toBe("1");
  });

  it("lists the thumbnails as a listbox that follows the shown image", async () => {
    render(Lightbox);

    const list = screen.getByRole("listbox", { name: "Thumbnails" });
    expect(list).toHaveAttribute("aria-orientation", "horizontal");
    expect(option("Picture 1")).toHaveAttribute("aria-selected", "true");
    expect(option("Picture 1")).toHaveAttribute("tabindex", "0");
    expect(option("Picture 2")).toHaveAttribute("tabindex", "-1");

    await fireEvent.click(option("Picture 3"));

    expect(shownIndex()).toBe("2");
    expect(option("Picture 3")).toHaveAttribute("aria-selected", "true");
    expect(option("Picture 1")).toHaveAttribute("aria-selected", "false");
  });

  it("loads the thumbnail in the strip and the neighbours ahead of time", () => {
    const { container } = render(Lightbox, { props: { index: 1 } });

    expect(
      container.ownerDocument.querySelector("img[src='/thumb-3.jpg']"),
    ).not.toBeNull();
    expect(requested).toEqual(
      expect.arrayContaining(["/full-3.jpg", "/full-1.jpg"]),
    );
    expect(requested).not.toContain("/full-4.jpg");
  });

  it("loads only the shown image with preload 0", () => {
    render(Lightbox, { props: { preload: 0 } });

    expect(requested).toEqual(["/full-1.jpg"]);
  });

  it("announces the position and caption after a change, not on open", async () => {
    vi.useFakeTimers();
    render(Lightbox);
    const status = () =>
      within(dialog())
        .getAllByRole("status")
        .map((node) => node.textContent?.trim());

    expect(status()).not.toContain("Image 2 of 4. Caption 2");
    await fireEvent.keyDown(dialog(), { key: "ArrowRight" });
    await tick();

    expect(status()).toContain("Image 2 of 4. Caption 2");
    vi.useRealTimers();
  });

  it("closes on Escape with its trigger", async () => {
    render(Lightbox);

    await fireEvent.keyDown(dialog(), { key: "Escape" });

    expect(screen.getByTestId("closes")).toHaveTextContent("escape-key");
  });

  it("offers a download of the shown image", () => {
    render(Lightbox, { props: { downloadable: true } });

    const download = screen.getByRole("link", { name: "Download image" });
    expect(download).toHaveAttribute("href", "/full-1.jpg");
    expect(download).toHaveAttribute("download");
  });

  it("hides the strip and buttons for a single image, and the strip on request", () => {
    const { unmount } = render(Lightbox, { props: { count: 1 } });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Next image" })).toBeNull();
    unmount();

    render(Lightbox, { props: { thumbnails: false } });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Next image" }),
    ).toBeInTheDocument();
  });
});
