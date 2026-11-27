import { configure, render, screen, waitFor } from "@testing-library/svelte";
import FilePreview from "carbon-components-svelte/FilePreview/FilePreview.svelte";
import { user } from "../utils/user";
import FilePreviewEvents from "./FilePreviewEvents.test.svelte";

// The first preview of each type imports its renderer, which a cold run compiles.
configure({ asyncUtilTimeout: 5000 });

const MIB = 1024 * 1024;

// jsdom has no object URLs. Keep the blob behind each one, so a test can see
// what type it got and whether it was revoked.
const made = new Map<string, Blob>();
const revoked = new Set<string>();
let counter = 0;

beforeEach(() => {
  made.clear();
  revoked.clear();
  counter = 0;
  URL.createObjectURL = vi.fn((blob: Blob) => {
    const url = `blob:test/${++counter}`;
    made.set(url, blob);
    return url;
  });
  URL.revokeObjectURL = vi.fn((url: string) => {
    revoked.add(url);
  });
});

// The message sits in the card and again in the live region.
const expectFallback = async (message: string) => {
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent(message),
  );
};

const textFile = (body: string, name: string, type = "text/plain") =>
  new File([body], name, { type });

describe("FilePreview", () => {
  it("labels the region by the file name and shows its type and size", async () => {
    render(FilePreview, { file: textFile("hello", "notes.txt") });

    const region = await screen.findByRole("region", { name: "notes.txt" });

    expect(region).toHaveTextContent("TXT");
    expect(region).toHaveTextContent("5 B");
    expect(await screen.findByText("hello")).toBeInTheDocument();
  });

  it("shows text as text and never as HTML", async () => {
    const hostile =
      '<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>';
    const { container } = render(FilePreview, {
      file: textFile(hostile, "page.html", "text/html"),
    });

    await screen.findByRole("group", { name: "page.html" });

    expect(container.querySelector("img, script")).toBeNull();
    expect(container.querySelector("pre")?.textContent).toBe(hostile);
    expect((window as unknown as { __xss?: number }).__xss).toBeUndefined();
  });

  it("colors source with the highlight function it is given", async () => {
    const highlight = vi.fn((code: string) => [
      { type: "keyword", text: code },
    ]);
    const { container } = render(FilePreview, {
      file: textFile("const a = 1;", "a.ts"),
      highlight,
    });

    await waitFor(() =>
      expect(container.querySelector(".tok-keyword")).not.toBeNull(),
    );

    expect(highlight).toHaveBeenCalledWith("const a = 1;", "ts");
  });

  it("shows a bare Blob by its `name` and `type` props", async () => {
    const { container } = render(FilePreview, {
      file: new Blob(["a,b\n1,2"]),
      name: "data.csv",
      type: "text/csv",
    });

    await screen.findByRole("table");

    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
  });

  it("renders text input with a name that picks the renderer", async () => {
    render(FilePreview, { text: '{"a":1}', name: "x.json" });

    const code = await screen.findByRole("group", { name: "x.json" });

    expect(code.textContent).toBe('{\n  "a": 1\n}');
  });

  it("reads non-UTF-8 text as Windows-1252 and says so", async () => {
    const latin1 = new File(
      [new Uint8Array([0x43, 0x61, 0x66, 0xe9])],
      "menu.txt",
      {
        type: "text/plain",
      },
    );
    render(FilePreview, { file: latin1 });

    expect(await screen.findByText("Café")).toBeInTheDocument();
    expect(screen.getByText("Read as windows-1252.")).toBeInTheDocument();
  });

  it("falls back to the file card when text is really binary", async () => {
    const png = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 1])],
      "notes.txt",
      {
        type: "text/plain",
      },
    );
    const onError = vi.fn<(event: CustomEvent) => void>();
    render(FilePreviewEvents, { file: png, onError });

    await expectFallback("No preview is available for this file type.");
    expect(screen.getByRole("link", { name: "Download" })).toBeInTheDocument();
    expect(onError.mock.calls[0][0].detail.reason).toBe("unsupported");
  });

  it("shows a card with a download for an unknown type", async () => {
    render(FilePreview, {
      file: new File(["PK"], "backup.zip", { type: "application/zip" }),
    });

    await expectFallback("No preview is available for this file type.");
  });

  it("renders an SVG through an <img> from an image blob URL, not inline", async () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" onload="window.__xss=1"><script>window.__xss=1</script></svg>';
    const { container } = render(FilePreview, {
      file: new File([svg], "logo.svg", { type: "image/svg+xml" }),
    });

    const image = await screen.findByRole("img", { name: "logo.svg" });

    expect(container.querySelector("svg:not([aria-hidden])")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(made.get(image.getAttribute("src") as string)?.type).toBe(
      "image/svg+xml",
    );
  });

  it("gives the download link an octet-stream URL, so opening it never runs the file", async () => {
    render(FilePreview, {
      file: new File(["<script>1</script>"], "page.html", {
        type: "text/html",
      }),
    });

    const link = await screen.findByRole("link", { name: "Download" });

    expect(link).toHaveAttribute("download", "page.html");
    expect(made.get(link.getAttribute("href") as string)?.type).toBe(
      "application/octet-stream",
    );
    for (const blob of made.values()) {
      expect(blob.type).not.toBe("text/html");
    }
  });

  it("revokes every object URL when it goes away", async () => {
    const { unmount } = render(FilePreview, {
      file: new File([new Uint8Array(8)], "a.png", { type: "image/png" }),
    });
    await screen.findByRole("img", { name: "a.png" });
    expect(made.size).toBeGreaterThan(0);

    unmount();

    expect([...made.keys()].every((url) => revoked.has(url))).toBe(true);
  });

  it("revokes the old URLs when the file changes", async () => {
    const { rerender } = render(FilePreview, {
      file: textFile("one", "one.txt"),
    });
    await screen.findByText("one");
    const first = [...made.keys()];

    await rerender({ file: textFile("two", "two.txt") });
    await screen.findByText("two");

    expect(first.every((url) => revoked.has(url))).toBe(true);
  });

  it("reads only the first maxBytes of a 50 MB text file", async () => {
    const file = new File(["x"], "access.log", { type: "text/plain" });
    Object.defineProperty(file, "size", { value: 50 * MIB });
    const slice = vi
      .spyOn(file, "slice")
      .mockReturnValue(new Blob(["GET /orders 200\n".padEnd(MIB, " ")]));
    render(FilePreview, { file });

    expect(await screen.findByText(/GET \/orders 200/)).toBeInTheDocument();

    expect(slice).toHaveBeenCalledWith(0, MIB);
    expect(
      screen.getByText("Showing the first 1 MB of 52.4 MB."),
    ).toBeInTheDocument();
  });

  it("does not read a 50 MB image: it falls back as too large", async () => {
    const file = new File(["x"], "scan.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 50 * MIB });
    const slice = vi.spyOn(file, "slice");
    render(FilePreview, { file });

    await expectFallback("This file is too large to preview.");

    expect(slice).not.toHaveBeenCalled();
    expect(screen.queryByRole("img", { name: "scan.png" })).toBeNull();
  });

  it("shows a markdown file rendered, with only safe links", async () => {
    const source =
      "# Title\n\n[ok](https://example.com/) [bad](javascript:alert(1)) <img src=x onerror=alert(1)>\n";
    const { container } = render(FilePreview, {
      file: textFile(source, "README.md", "text/markdown"),
    });

    await screen.findByRole("heading", { name: "Title" });

    const links = [
      ...container.querySelectorAll(".bx--file-preview__document a"),
    ];
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "https://example.com/",
    ]);
    expect(links[0]).toHaveAttribute("rel", "noopener noreferrer nofollow");
    expect(container.querySelector("img")).toBeNull();
    expect(container).toHaveTextContent("<img src=x onerror=alert(1)>");
  });

  it("caps CSV rows and shows more on request", async () => {
    let body = "id\n";
    for (let i = 1; i <= 250; i++) body += `${i}\n`;
    const { container } = render(FilePreview, {
      file: textFile(body, "ids.csv", "text/csv"),
    });

    await screen.findByRole("table");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(100);
    expect(screen.getByText("Showing 100 of 250 rows.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show more" }));

    expect(container.querySelectorAll("tbody tr")).toHaveLength(200);
  });

  it("uses an app renderer before the built-ins, and a lazy one loads on demand", async () => {
    const load = vi.fn(() => import("./Custom.test.svelte"));
    render(FilePreview, {
      file: textFile("hi", "notes.txt"),
      renderers: [
        {
          id: "mine",
          match: (_mime: string, name: string) => name.endsWith(".txt"),
          load,
        },
      ],
    });

    expect(await screen.findByTestId("custom")).toHaveTextContent("notes.txt");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("does not reload when an equal renderers array is handed over again", async () => {
    const load = vi.fn(() => import("./Custom.test.svelte"));
    const renderer = { id: "mine", match: () => true, load };
    const { rerender } = render(FilePreview, {
      file: textFile("a", "a.txt"),
      renderers: [renderer],
    });
    await screen.findByTestId("custom");

    await rerender({ renderers: [renderer] });

    expect(load).toHaveBeenCalledTimes(1);
  });

  describe("src", () => {
    const response = (body: BodyInit, init: ResponseInit = {}) =>
      new Response(body, { status: 200, ...init });

    it("fetches, uses the response type and file name, and previews it", async () => {
      const fetchMock = vi.fn((_url: string) =>
        response("a,b\n1,2", {
          headers: { "content-type": "text/csv; charset=utf-8" },
        }),
      );
      vi.stubGlobal("fetch", fetchMock);
      render(FilePreview, { src: "https://files.example/q3/report%20one.csv" });

      expect(await screen.findByRole("table")).toBeInTheDocument();

      expect(
        screen.getByRole("region", { name: "report one.csv" }),
      ).toBeInTheDocument();
      expect(fetchMock.mock.calls[0][0]).toBe(
        "https://files.example/q3/report%20one.csv",
      );
    });

    it("stops the read at the cap and shows the start", async () => {
      const big = "line of a log\n".repeat(Math.ceil((2 * MIB) / 14));
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          response(big, { headers: { "content-type": "text/plain" } }),
        ),
      );
      render(FilePreview, { src: "https://files.example/big.log" });

      expect(
        await screen.findByText(/^Showing the first 1 MB\.$/),
      ).toBeInTheDocument();
    });

    it("shows the card when the fetch fails, as with CORS, and keeps a link to the file", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
      );
      render(FilePreview, { src: "https://other.example/a.txt" });

      await expectFallback("This file could not be loaded.");
      expect(screen.getByRole("link", { name: "Download" })).toHaveAttribute(
        "href",
        "https://other.example/a.txt",
      );
    });

    it("shows the card for an HTTP error", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() => response("nope", { status: 404 })),
      );
      render(FilePreview, { src: "https://files.example/gone.txt" });

      await expectFallback("This file could not be loaded.");
    });

    it("never fetches a javascript: URL", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      render(FilePreview, { src: "javascript:alert(1)" });

      await expectFallback("No preview is available for this file type.");

      expect(fetchMock).not.toHaveBeenCalled();
      expect(screen.queryByRole("link", { name: "Download" })).toBeNull();
    });

    it("aborts the fetch when the source changes, and ignores the late answer", async () => {
      let signal: AbortSignal | undefined;
      let finishFirst: (value: Response) => void = () => {};
      const fetchMock = vi
        .fn()
        .mockImplementationOnce((_url: string, init: RequestInit) => {
          signal = init.signal ?? undefined;
          return new Promise<Response>((resolve) => {
            finishFirst = resolve;
          });
        })
        .mockImplementation(() =>
          response("second", { headers: { "content-type": "text/plain" } }),
        );
      vi.stubGlobal("fetch", fetchMock);
      const { rerender } = render(FilePreview, {
        src: "https://files.example/first.txt",
      });
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

      await rerender({ src: "https://files.example/second.txt" });
      finishFirst(
        response("first", { headers: { "content-type": "text/plain" } }),
      );

      expect(await screen.findByText("second")).toBeInTheDocument();
      expect(signal?.aborted).toBe(true);
      expect(screen.queryByText("first")).toBeNull();
    });
  });

  it("fires load for a shown file and load:error for a fallback", async () => {
    const onLoad = vi.fn<(event: CustomEvent) => void>();
    const onError = vi.fn<(event: CustomEvent) => void>();
    render(FilePreviewEvents, {
      file: textFile("x", "a.txt"),
      onLoad,
      onError,
    });

    await screen.findByText("x");
    await waitFor(() => expect(onLoad).toHaveBeenCalled());

    expect(onLoad.mock.calls[0][0].detail).toMatchObject({
      renderer: "text",
      name: "a.txt",
      truncated: false,
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it("lets a consumer aria-label replace the file-name label", async () => {
    render(FilePreview, {
      file: textFile("x", "a.txt"),
      "aria-label": "Attachment",
    });

    expect(
      await screen.findByRole("region", { name: "Attachment" }),
    ).toBeInTheDocument();
  });

  it("keeps the file name as the label when the header is hidden", async () => {
    render(FilePreview, { file: textFile("x", "a.txt"), hideHeader: true });

    expect(
      await screen.findByRole("region", { name: "a.txt" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Download" })).toBeNull();
  });
});
