import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import FileUploaderItem from "./FileUploaderItem.test.svelte";

describe("FileUploaderItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with default props", () => {
    const { container } = render(FileUploaderItem, {
      props: { name: "test.txt" },
    });

    expect(screen.getByText("test.txt")).toBeInTheDocument();

    const item = container.querySelector(".bx--file__selected-file");
    assert(item);
    expect(item).toBeInTheDocument();
  });

  it("should render with different status values", () => {
    const { container: container1 } = render(FileUploaderItem, {
      props: { name: "test.txt", status: "uploading" },
    });

    const { container: container2 } = render(FileUploaderItem, {
      props: { name: "test.txt", status: "edit" },
    });

    const { container: container3 } = render(FileUploaderItem, {
      props: { name: "test.txt", status: "complete" },
    });

    // All should render
    expect(
      container1.querySelector(".bx--file__selected-file"),
    ).toBeInTheDocument();
    expect(
      container2.querySelector(".bx--file__selected-file"),
    ).toBeInTheDocument();
    expect(
      container3.querySelector(".bx--file__selected-file"),
    ).toBeInTheDocument();
  });

  it("should render with different size values", () => {
    const { container: container1 } = render(FileUploaderItem, {
      props: { name: "test.txt", size: "default" },
    });

    const { container: container2 } = render(FileUploaderItem, {
      props: { name: "test.txt", size: "field" },
    });

    const { container: container3 } = render(FileUploaderItem, {
      props: { name: "test.txt", size: "small" },
    });

    const item1 = container1.querySelector(".bx--file__selected-file");
    const item2 = container2.querySelector(".bx--file__selected-file");
    const item3 = container3.querySelector(".bx--file__selected-file");

    assert(item1);
    assert(item2);
    assert(item3);

    expect(item2).toHaveClass("bx--file__selected-file--md");
    expect(item3).toHaveClass("bx--file__selected-file--sm");
  });

  it("should render invalid state", () => {
    const { container } = render(FileUploaderItem, {
      props: { name: "test.txt", invalid: true },
    });

    const item = container.querySelector(".bx--file__selected-file");
    assert(item);
    expect(item).toHaveClass("bx--file__selected-file--invalid");
  });

  it("should render error subject when invalid", () => {
    render(FileUploaderItem, {
      props: {
        name: "test.txt",
        invalid: true,
        errorSubject: "File size exceeds limit",
      },
    });

    expect(screen.getByText("File size exceeds limit")).toBeInTheDocument();
  });

  it("should render error body when invalid", () => {
    render(FileUploaderItem, {
      props: {
        name: "test.txt",
        invalid: true,
        errorSubject: "Error",
        errorBody: "Please select a smaller file",
      },
    });

    expect(
      screen.getByText("Please select a smaller file"),
    ).toBeInTheDocument();
  });

  it("should not render error message when not invalid", () => {
    render(FileUploaderItem, {
      props: {
        name: "test.txt",
        invalid: false,
        errorSubject: "Error",
        errorBody: "Error message",
      },
    });

    expect(screen.queryByText("Error")).not.toBeInTheDocument();
    expect(screen.queryByText("Error message")).not.toBeInTheDocument();
  });

  it("should dispatch delete event on click when status is edit", async () => {
    const deleteHandler = vi.fn();
    const { container } = render(FileUploaderItem, {
      props: {
        name: "test.txt",
        status: "edit",
        id: "file-1",
        ondelete: deleteHandler,
      },
    });

    const closeButton = container.querySelector(
      ".bx--file__state-container button",
    );
    assert(closeButton instanceof HTMLElement);

    await user.click(closeButton);

    await vi.waitFor(() => {
      expect(deleteHandler).toHaveBeenCalled();
    });

    const event = deleteHandler.mock.calls[0][0];
    expect(event.detail).toBe("file-1");
  });

  it("should dispatch delete event on keyboard interaction when status is edit", async () => {
    const deleteHandler = vi.fn();
    const { container } = render(FileUploaderItem, {
      props: {
        name: "test.txt",
        status: "edit",
        id: "file-1",
        ondelete: deleteHandler,
      },
    });

    const closeButton = container.querySelector(
      ".bx--file__state-container button",
    );
    assert(closeButton instanceof HTMLElement);

    closeButton.focus();
    await user.keyboard("{Enter}");

    await vi.waitFor(() => {
      expect(deleteHandler).toHaveBeenCalled();
    });

    const event = deleteHandler.mock.calls[0][0];
    expect(event.detail).toBe("file-1");
  });

  it("should handle iconDescription prop", () => {
    const { container } = render(FileUploaderItem, {
      props: {
        name: "test.txt",
        status: "edit",
        iconDescription: "Remove file",
      },
    });

    const closeButton = container.querySelector(
      ".bx--file__state-container button",
    );
    assert(closeButton instanceof HTMLElement);
    expect(closeButton).toHaveAttribute("aria-label", "Remove file");
  });

  it("should handle id prop", () => {
    const { container } = render(FileUploaderItem, {
      props: { name: "test.txt", id: "custom-file-id" },
    });

    const item = container.querySelector(".bx--file__selected-file");
    assert(item);
    expect(item).toHaveAttribute("id", "custom-file-id");
  });

  it("should handle name prop", () => {
    render(FileUploaderItem, {
      props: { name: "custom-filename.txt" },
    });

    expect(screen.getByText("custom-filename.txt")).toBeInTheDocument();
  });

  it("should handle mouse events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(FileUploaderItem, {
      props: {
        name: "test.txt",
        onmouseover: () => console.log("mouseover"),
        onmouseenter: () => console.log("mouseenter"),
        onmouseleave: () => console.log("mouseleave"),
      },
    });

    const item = container.querySelector(".bx--file__selected-file");
    assert(item instanceof HTMLElement);

    await user.hover(item);
    expect(consoleLog).toHaveBeenCalledWith("mouseover");

    await user.unhover(item);
    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });
});
