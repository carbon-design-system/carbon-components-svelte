import { render } from "@testing-library/svelte";
import { user } from "../setup-tests";
import Filename from "./Filename.test.svelte";

describe("Filename", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render uploading status with loading indicator", () => {
    const { container } = render(Filename, {
      props: { status: "uploading" },
    });

    const loading = container.querySelector(".bx--loading");
    expect(loading).toBeInTheDocument();
  });

  it("should render edit status with close button", () => {
    const { container } = render(Filename, {
      props: { status: "edit" },
    });

    const closeButton = container.querySelector(".bx--file-close");
    assert(closeButton);
    expect(closeButton).toBeInTheDocument();
    expect(closeButton.tagName).toBe("BUTTON");
  });

  it("should render complete status with checkmark", () => {
    const { container } = render(Filename, {
      props: { status: "complete" },
    });

    const checkmark = container.querySelector(".bx--file-complete");
    expect(checkmark).toBeInTheDocument();
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
      props: { status: "edit", iconDescription: "Remove file" },
    });

    const closeButton = container.querySelector(".bx--file-close");
    assert(closeButton);
    expect(closeButton).toHaveAttribute("aria-label", "Remove file");
  });

  it("should handle iconDescription prop for complete status", () => {
    const { container } = render(Filename, {
      props: { status: "complete", iconDescription: "Upload complete" },
    });

    const checkmark = container.querySelector(".bx--file-complete");
    assert(checkmark);
    const ariaLabel = checkmark.getAttribute("aria-label");
    const title = checkmark.getAttribute("title");
    expect(ariaLabel || title).toBe("Upload complete");
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

  it("should handle keyboard interaction on close button", async () => {
    const keydownHandler = vi.fn();
    const { container } = render(Filename, {
      props: { status: "edit", onkeydown: keydownHandler },
    });

    const closeButton = container.querySelector(".bx--file-close");
    assert(closeButton instanceof HTMLElement);

    closeButton.focus();
    await user.keyboard("{Enter}");

    expect(keydownHandler).toHaveBeenCalled();
  });

  it("should handle Space key on close button", async () => {
    const keydownHandler = vi.fn();
    const { container } = render(Filename, {
      props: { status: "edit", onkeydown: keydownHandler },
    });

    const closeButton = container.querySelector(".bx--file-close");
    assert(closeButton instanceof HTMLElement);

    closeButton.focus();
    await user.keyboard(" ");

    expect(keydownHandler).toHaveBeenCalled();
  });

  it("should be focusable when status is edit", () => {
    const { container } = render(Filename, {
      props: { status: "edit" },
    });

    const closeButton = container.querySelector(".bx--file-close");
    assert(closeButton instanceof HTMLElement);
    expect(closeButton).toHaveAttribute("tabindex", "0");
  });
});
