import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import FileDownloadItem from "./FileDownloadItem.test.svelte";

describe("FileDownloadItem", () => {
  it("renders a download link named by the action, file and size", () => {
    render(FileDownloadItem, { props: { href: "/files/report.pdf" } });

    const link = screen.getByRole("link", {
      name: "Download report.pdf 2.4 MB",
    });
    expect(link).toHaveAttribute("href", "/files/report.pdf");
    expect(link).toHaveAttribute("download", "");
  });

  it("suggests a file name, or opens the file, through `download`", async () => {
    const { rerender } = render(FileDownloadItem, {
      props: { href: "/f/1", download: "Q3 report.pdf" },
    });
    expect(screen.getByRole("link")).toHaveAttribute(
      "download",
      "Q3 report.pdf",
    );

    await rerender({ download: false });
    expect(screen.getByRole("link")).not.toHaveAttribute("download");
  });

  it("renders a button without `href`, for a download handled in on:click", async () => {
    const onclick = vi.fn();
    render(FileDownloadItem, { props: { onclick } });

    await user.click(screen.getByRole("button", { name: /report\.pdf/ }));
    expect(onclick).toHaveBeenCalledOnce();
  });

  it("drops the link's `href` when disabled", () => {
    render(FileDownloadItem, { props: { href: "/f/1", disabled: true } });

    const link = screen.getByRole("link");
    expect(link).not.toHaveAttribute("href");
    expect(link).not.toHaveAttribute("download");
    expect(link).toHaveAttribute("aria-disabled", "true");
  });
});
