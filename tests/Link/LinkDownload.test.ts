import { render, screen } from "@testing-library/svelte";
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

    const { pathname } = window.location;
    await user.click(link);

    expect(window.location.pathname).toBe(pathname);
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

  it("does not download when disabled", async () => {
    const download = vi.fn();

    render(LinkDownload, { props: { disabled: true, download } });
    await user.click(getLink());

    expect(download).not.toHaveBeenCalled();
  });
});
