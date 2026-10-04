import { render } from "@testing-library/svelte";
import { user } from "../utils/user";
import Filename from "./Filename.test.svelte";

describe("Filename", () => {
  it("should render edit status with close button", () => {
    const { container } = render(Filename, {
      props: { status: "edit" },
    });

    const closeButton = container.querySelector(".bx--file-close");
    assert(closeButton);
    expect(closeButton).toBeInTheDocument();
    expect(closeButton.tagName).toBe("BUTTON");
    expect(closeButton).toHaveAttribute("aria-label", "Remove file");
  });

  it("should name the close button after the file by default", () => {
    const { container } = render(Filename, {
      props: { status: "edit", fileName: "Q3-report.pdf" },
    });

    const closeButton = container.querySelector(".bx--file-close");
    assert(closeButton);
    expect(closeButton).toHaveAttribute(
      "aria-label",
      "Remove file Q3-report.pdf",
    );
  });

  it("should render complete status with checkmark", () => {
    const { container } = render(Filename, {
      props: { status: "complete" },
    });

    const checkmark = container.querySelector(".bx--file-complete");
    expect(checkmark).toBeInTheDocument();
    assert(checkmark);
    expect(checkmark.getAttribute("aria-label")).toBe("Upload complete");
    const titleEl = checkmark.querySelector("title");
    assert(titleEl);
    expect(titleEl).toHaveTextContent("Upload complete");
  });

  it("should render invalid state with warning icon when status is edit", () => {
    const { container } = render(Filename, {
      props: { status: "edit", invalid: true },
    });

    const warningIcon = container.querySelector(".bx--file-invalid");
    expect(warningIcon).toBeInTheDocument();
  });

  it("should not render warning icon when not invalid", () => {
    const { container } = render(Filename, {
      props: { status: "edit", invalid: false },
    });

    const warningIcon = container.querySelector(".bx--file-invalid");
    expect(warningIcon).not.toBeInTheDocument();
  });

  it("should use default uploading description when iconDescription is omitted", () => {
    const { container } = render(Filename, {
      props: { status: "uploading" },
    });

    const loading = container.querySelector(".bx--loading");
    assert(loading);
    const title = loading.querySelector("title");
    assert(title);
    expect(title).toHaveTextContent("uploading");
  });

  it("should handle iconDescription prop for uploading status", () => {
    const { container } = render(Filename, {
      props: { status: "uploading", iconDescription: "Uploading file" },
    });

    const loading = container.querySelector(".bx--loading");
    assert(loading);
    const title = loading.querySelector("title");
    assert(title);
    expect(title).toHaveTextContent("Uploading file");
  });

  it("should handle iconDescription prop for edit status", () => {
    const { container } = render(Filename, {
      props: { status: "edit", iconDescription: "Discard report" },
    });

    const closeButton = container.querySelector(".bx--file-close");
    assert(closeButton);
    expect(closeButton).toHaveAttribute("aria-label", "Discard report");
  });

  it("should resolve iconDescription function with context for edit status", () => {
    const fn = vi.fn((ctx: { fileName: string }) => `Remove ${ctx.fileName}`);
    const file = new File(["x"], "doc.txt", { type: "text/plain" });
    const { container } = render(Filename, {
      props: {
        status: "edit",
        file,
        fileName: "doc.txt",
        iconDescription: fn,
      },
    });

    expect(fn).toHaveBeenCalledWith(
      expect.objectContaining({
        file,
        fileName: "doc.txt",
        status: "edit",
        invalid: false,
      }),
    );
    const closeButton = container.querySelector(".bx--file-close");
    assert(closeButton);
    expect(closeButton).toHaveAttribute("aria-label", "Remove doc.txt");
  });

  it("should fall back to defaults when iconDescription function returns undefined", () => {
    const { container } = render(Filename, {
      props: {
        status: "edit",
        fileName: "x.txt",
        iconDescription: () => undefined,
      },
    });

    const closeButton = container.querySelector(".bx--file-close");
    assert(closeButton);
    expect(closeButton).toHaveAttribute("aria-label", "Remove file x.txt");
  });

  it("should fall back to defaults when iconDescription function returns only whitespace", () => {
    const { container } = render(Filename, {
      props: {
        status: "edit",
        iconDescription: () => "   ",
      },
    });

    const closeButton = container.querySelector(".bx--file-close");
    assert(closeButton);
    expect(closeButton).toHaveAttribute("aria-label", "Remove file");
  });

  it("should handle iconDescription prop for complete status", () => {
    const { container } = render(Filename, {
      props: { status: "complete", iconDescription: "Report received" },
    });

    const checkmark = container.querySelector(".bx--file-complete");
    assert(checkmark);
    expect(checkmark.getAttribute("aria-label")).toBe("Report received");
    expect(checkmark.querySelector("title")).toHaveTextContent(
      "Report received",
    );
  });

  it("should handle click event on close button", async () => {
    const clickHandler = vi.fn();
    const { container } = render(Filename, {
      props: { status: "edit", onclick: clickHandler },
    });

    const closeButton = container.querySelector(".bx--file-close");
    assert(closeButton instanceof HTMLElement);

    await user.click(closeButton);

    expect(clickHandler).toHaveBeenCalled();
  });

  it.each([
    ["Enter", "{Enter}"],
    ["Space", " "],
  ])("should handle %s key on close button", async (_, key) => {
    const keydownHandler = vi.fn();
    const { container } = render(Filename, {
      props: { status: "edit", onkeydown: keydownHandler },
    });

    const closeButton = container.querySelector(".bx--file-close");
    assert(closeButton instanceof HTMLElement);

    closeButton.focus();
    await user.keyboard(key);

    expect(keydownHandler).toHaveBeenCalled();
  });
});
