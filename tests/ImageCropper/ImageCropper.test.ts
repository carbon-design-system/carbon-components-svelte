import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { loadImageElement } from "../../src/utils/image-crop-export.js";
import ImageCropper from "./ImageCropper.test.svelte";

// jsdom decodes no image and draws no canvas, so the loader and the preview
// are stubbed; the geometry, the keys and the events are the component's own.
vi.mock("../../src/utils/image-crop-export.js", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../../src/utils/image-crop-export.js")
  >()),
  loadImageElement: vi.fn(async () => ({
    naturalWidth: 600,
    naturalHeight: 400,
  })),
  drawPreview: vi.fn(
    (
      _canvas: unknown,
      image: { naturalWidth: number; naturalHeight: number },
    ) => ({
      width: image.naturalWidth,
      height: image.naturalHeight,
      scale: 1,
    }),
  ),
}));

const stage = () => screen.getByRole("group", { name: "Crop image" });
const value = () =>
  JSON.parse(screen.getByTestId("value").textContent ?? "null");

async function ready(props: Record<string, unknown> = {}) {
  const result = render(ImageCropper, { props });
  await vi.waitFor(() => expect(stage()).toHaveAttribute("tabindex", "0"));
  return result;
}

describe("ImageCropper", () => {
  beforeEach(() => {
    // A 640 x 384 stage: a square frame is 336 px, a scale of 0.84.
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(640);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(384);
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:photo"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("reports the starting crop and describes the keys", async () => {
    await ready();

    expect(value()).toEqual({
      x: 100,
      y: 0,
      width: 400,
      height: 400,
      rotate: 0,
      flipX: false,
      flipY: false,
    });
    expect(stage()).toHaveAttribute("aria-roledescription", "image cropper");
    const hint = document.getElementById(
      stage().getAttribute("aria-describedby") ?? "",
    );
    expect(hint).toHaveTextContent("Arrow keys move the image");
  });

  it("moves the image with the arrow keys and dispatches one change each", async () => {
    const onChange = vi.fn();
    await ready({ onChange });

    // The image goes left, so the crop goes right by 8 px / 0.84.
    await fireEvent.keyDown(stage(), { key: "ArrowLeft" });
    expect(value().x).toBe(110);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ x: 110 }));

    // The box moves the way the key points.
    await fireEvent.keyDown(stage(), { key: "ArrowRight" });
    expect(value().x).toBe(100);
  });

  it("zooms with + and -, and turns with the square brackets", async () => {
    await ready();

    await fireEvent.keyDown(stage(), { key: "+" });
    expect(value().width).toBeLessThan(400);
    await fireEvent.keyDown(stage(), { key: "]" });
    expect(value().rotate).toBe(90);
    await fireEvent.keyDown(stage(), { key: "[" });
    await fireEvent.keyDown(stage(), { key: "[" });
    expect(value().rotate).toBe(-90);
  });

  it("holds the minimum output size", async () => {
    await ready({ minWidth: 380 });

    for (let i = 0; i < 6; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: key presses are ordered
      await fireEvent.keyDown(stage(), { key: "+" });
    }
    expect(value().width).toBe(380);
  });

  it("lets a crop set from outside replace the starting one", async () => {
    await ready({
      value: {
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        rotate: 0,
        flipX: false,
        flipY: false,
      },
    });
    expect(value()).toMatchObject({ x: 0, y: 0, width: 200 });
  });

  it("shows eight handles in box mode, each a named button", async () => {
    await ready({ mode: "box", aspect: null });

    const handles = screen.getAllByRole("button", { name: /^Resize / });
    expect(handles).toHaveLength(8);
    expect(handles[0]).toHaveAttribute("aria-roledescription", "resize handle");
    // 480 x 320 at (60, 40): the right handle grows the box by 10 px.
    await fireEvent.keyDown(
      screen.getByRole("button", { name: "Resize right" }),
      {
        key: "ArrowRight",
      },
    );
    expect(value().width).toBe(490);
    expect(value().height).toBe(320);
  });

  it("alerts and names HEIC when the image can't be decoded", async () => {
    vi.mocked(loadImageElement).mockRejectedValueOnce(new Error("x"));
    const onError = vi.fn();
    render(ImageCropper, {
      props: {
        src: new File([new Uint8Array(4)], "photo.heic", {
          type: "image/heic",
        }),
        onError,
      },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("HEIC");
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: "unsupported" }),
    );
    expect(stage()).not.toHaveAttribute("tabindex");
  });

  it("revokes the object URL it made for a file", async () => {
    const file = new File([new Uint8Array(4)], "photo.png", {
      type: "image/png",
    });
    const { unmount } = await ready({ src: file });

    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:photo");
  });

  it("takes its strings from translateWithId", async () => {
    await ready({
      translateWithId: (id: string) => (id === "rotate-left" ? "Gauche" : ""),
    });

    expect(screen.getByRole("button", { name: "Gauche" })).toBeInTheDocument();
    // An id it returns nothing for keeps the English string.
    expect(
      screen.getByRole("button", { name: "Rotate right" }),
    ).toBeInTheDocument();
    await tick();
  });
});
