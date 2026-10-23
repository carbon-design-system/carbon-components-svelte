import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import FileUploaderItem from "./FileUploaderItem.test.svelte";

describe("FileUploaderItem", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["uploading", ".bx--loading"],
    ["edit", "button.bx--file-close"],
    ["complete", ".bx--file-complete"],
  ])("should render the %s status icon", (status, selector) => {
    const statusIcons = [
      ".bx--loading",
      "button.bx--file-close",
      ".bx--file-complete",
    ];
    const { container } = render(FileUploaderItem, {
      props: { name: "test.txt", status },
    });

    const stateContainer = container.querySelector(
      ".bx--file__state-container",
    );
    assert(stateContainer);
    for (const icon of statusIcons) {
      if (icon === selector) {
        expect(stateContainer.querySelector(icon)).toBeInTheDocument();
      } else {
        expect(stateContainer.querySelector(icon)).toBeNull();
      }
    }
  });

  it.each([
    ["default", []],
    ["field", ["md"]],
    ["small", ["sm"]],
    ["xs", ["xs"]],
  ])("should apply the size modifier for size %s", (size, modifiers) => {
    const { container } = render(FileUploaderItem, {
      props: { name: "test.txt", size },
    });

    const item = container.querySelector(".bx--file__selected-file");
    assert(item);
    for (const modifier of ["md", "sm", "xs"]) {
      if (modifiers.includes(modifier)) {
        expect(item).toHaveClass(`bx--file__selected-file--${modifier}`);
      } else {
        expect(item).not.toHaveClass(`bx--file__selected-file--${modifier}`);
      }
    }
  });

  it("should render invalid state with its error copy", () => {
    const { container } = render(FileUploaderItem, {
      props: {
        name: "test.txt",
        invalid: true,
        errorSubject: "File size exceeds limit",
        errorBody: "Please select a smaller file",
      },
    });

    const item = container.querySelector(".bx--file__selected-file");
    assert(item);
    expect(item).toHaveClass("bx--file__selected-file--invalid");
    expect(screen.getByText("File size exceeds limit")).toBeInTheDocument();
    expect(
      screen.getByText("Please select a smaller file"),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "File size exceeds limit",
    );
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

  it.each(["click", "{Enter}", " "])(
    "should dispatch delete once per activation (%s)",
    async (action) => {
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

      if (action === "click") {
        await user.click(closeButton);
      } else {
        closeButton.focus();
        await user.keyboard(action);
      }

      expect(deleteHandler).toHaveBeenCalledTimes(1);
      expect(deleteHandler.mock.calls[0][0].detail).toBe("file-1");
    },
  );

  it("should handle iconDescription prop", () => {
    const { container } = render(FileUploaderItem, {
      props: {
        name: "test.txt",
        status: "edit",
        iconDescription: "Discard report",
      },
    });

    const closeButton = container.querySelector(
      ".bx--file__state-container button",
    );
    assert(closeButton instanceof HTMLElement);
    expect(closeButton).toHaveAttribute("aria-label", "Discard report");
  });

  it("should pass fileName to iconDescription function with file undefined", () => {
    const iconDescription = vi.fn(
      (ctx: { file?: File; fileName: string; invalid: boolean }) => {
        expect(ctx.file).toBeUndefined();
        expect(ctx.fileName).toBe("ledger.csv");
        return `Dismiss ${ctx.fileName}`;
      },
    );

    const { container } = render(FileUploaderItem, {
      props: {
        name: "ledger.csv",
        status: "edit",
        iconDescription,
      },
    });

    expect(iconDescription).toHaveBeenCalled();
    const closeButton = container.querySelector(
      ".bx--file__state-container button",
    );
    assert(closeButton instanceof HTMLElement);
    expect(closeButton).toHaveAttribute("aria-label", "Dismiss ledger.csv");
  });

  it("should handle id prop", () => {
    const { container } = render(FileUploaderItem, {
      props: { name: "test.txt", id: "custom-file-id" },
    });

    const item = container.querySelector(".bx--file__selected-file");
    assert(item);
    expect(item).toHaveAttribute("id", "custom-file-id");
  });

  it("should render the file size when provided", () => {
    render(FileUploaderItem, {
      props: { name: "test.txt", fileSize: 1500 },
    });

    expect(screen.getByText("1.5 kB")).toBeInTheDocument();
  });

  it("should render a string file size as-is", () => {
    render(FileUploaderItem, {
      props: { name: "test.txt", fileSize: "1,5 Kio" },
    });

    expect(screen.getByText("1,5 Kio")).toBeInTheDocument();
  });

  it("should not render a file size for an invalid number", () => {
    const { container } = render(FileUploaderItem, {
      props: { name: "test.txt", fileSize: Number.NaN },
    });

    expect(container.querySelector(".bx--file-size")).not.toBeInTheDocument();
  });

  it("should not render a file size when omitted", () => {
    const { container } = render(FileUploaderItem, {
      props: { name: "test.txt" },
    });

    expect(container.querySelector(".bx--file-size")).not.toBeInTheDocument();
  });

  it("should forward mouse events", async () => {
    const onmouseover = vi.fn();
    const onmouseenter = vi.fn();
    const onmouseleave = vi.fn();
    const { container } = render(FileUploaderItem, {
      props: { name: "test.txt", onmouseover, onmouseenter, onmouseleave },
    });

    const item = container.querySelector(".bx--file__selected-file");
    assert(item instanceof HTMLElement);

    await user.hover(item);
    expect(onmouseover).toHaveBeenCalledTimes(1);
    expect(onmouseenter).toHaveBeenCalledTimes(1);
    expect(onmouseleave).not.toHaveBeenCalled();

    await user.unhover(item);
    expect(onmouseleave).toHaveBeenCalledTimes(1);
  });

  it("should set a title on a truncated name", async () => {
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(10);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(100);
    render(FileUploaderItem, {
      props: { name: "quarterly-report-final.pdf" },
    });

    const name = screen.getByText("quarterly-report-final.pdf");
    await vi.waitFor(() => {
      expect(name).toHaveAttribute("title", "quarterly-report-final.pdf");
    });
  });
});
