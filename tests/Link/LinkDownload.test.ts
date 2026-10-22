import { fireEvent, render, screen } from "@testing-library/svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import LinkDownload from "./LinkDownload.test.svelte";

describe("LinkDownload", () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURL = vi.fn(() => "blob:mock-url");
    revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeObjectURL as typeof URL.revokeObjectURL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const getLink = () => screen.getByRole("link", { name: "Download CSV" });

  it("builds a Blob from string data and clicks a temporary anchor", async () => {
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    render(LinkDownload);
    await user.click(getLink());

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("text/csv;charset=utf-8");

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("does not navigate the underlying link", async () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(LinkDownload);
    const link = getLink();
    expect(link).toHaveAttribute("href", "#");

    const initialHash = window.location.hash;
    const notPrevented = await fireEvent.click(link);
    // `fireEvent` returns false when a handler called `preventDefault()`.
    expect(notPrevented).toBe(false);

    await user.click(link);
    // `href="#"` would otherwise set the hash to `#`.
    expect(window.location.hash).toBe(initialHash);
  });

  it("passes a Blob straight through without rewrapping it", async () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const blob = new Blob(["custom"], { type: "application/json" });

    render(LinkDownload, { props: { data: blob } });
    await user.click(getLink());

    expect(createObjectURL).toHaveBeenCalledWith(blob);
  });

  it("supports a custom download function", async () => {
    const download = vi.fn();

    render(LinkDownload, { props: { download } });
    await user.click(getLink());

    expect(download).toHaveBeenCalledWith(
      "id,name\n1,Alpha",
      "load-balancers.csv",
      "text/csv;charset=utf-8",
    );
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("dispatches download after a successful download", async () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const onDownload = vi.fn();

    render(LinkDownload, { props: { onDownload } });
    await user.click(getLink());

    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("dispatches download:error when the download function throws", async () => {
    const error = new Error("download failed");
    const download = vi.fn().mockRejectedValue(error);
    const onDownloadError = vi.fn();

    render(LinkDownload, { props: { download, onDownloadError } });
    await user.click(getLink());

    expect(onDownloadError).toHaveBeenCalledWith({ error });
  });

  it("does nothing with the default downloader when data is unset", async () => {
    const onDownload = vi.fn();

    render(LinkDownload, { props: { data: null, onDownload } });
    await user.click(getLink());

    expect(createObjectURL).not.toHaveBeenCalled();
    expect(onDownload).not.toHaveBeenCalled();
  });

  it("calls a custom download function even when data is unset", async () => {
    const download = vi.fn();

    render(LinkDownload, { props: { data: null, download } });
    await user.click(getLink());

    expect(download).toHaveBeenCalledWith(
      undefined,
      "load-balancers.csv",
      "text/csv;charset=utf-8",
    );
  });

  it("dispatches download:error when the download function throws synchronously", async () => {
    const error = new Error("download failed");
    const download = vi.fn(() => {
      throw error;
    });
    const onDownloadError = vi.fn();

    render(LinkDownload, { props: { download, onDownloadError } });
    await user.click(getLink());

    expect(onDownloadError).toHaveBeenCalledWith({ error });
  });

  it("dispatches download only after an async download resolves", async () => {
    let resolveDownload = () => {};
    const download = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveDownload = resolve;
        }),
    );
    const onDownload = vi.fn();

    render(LinkDownload, { props: { download, onDownload } });
    await user.click(getLink());
    expect(download).toHaveBeenCalledTimes(1);
    expect(onDownload).not.toHaveBeenCalled();

    resolveDownload();
    await flushMacrotask();

    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("forwards focus, blur, keydown, and keyup", async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onKeydown = vi.fn();
    const onKeyup = vi.fn();
    render(LinkDownload, { props: { onFocus, onBlur, onKeydown, onKeyup } });

    const link = getLink();
    link.focus();
    expect(onFocus).toHaveBeenCalledTimes(1);

    await user.keyboard("a");
    expect(onKeydown).toHaveBeenCalledTimes(1);
    expect(onKeyup).toHaveBeenCalledTimes(1);

    link.blur();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("does not download when disabled", async () => {
    const download = vi.fn();

    render(LinkDownload, { props: { disabled: true, download } });
    await user.click(getLink());

    expect(download).not.toHaveBeenCalled();
  });
});
