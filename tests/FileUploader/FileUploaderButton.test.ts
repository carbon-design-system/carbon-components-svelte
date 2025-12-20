import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import FileUploaderButton from "./FileUploaderButton.test.svelte";

describe("FileUploaderButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render button with icon and text", () => {
    render(FileUploaderButton);

    const button = screen.getByRole("button", { name: "Add file with icon" });
    expect(button).not.toHaveClass("bx--btn--icon-only");
    expect(button.textContent).toContain("Add file with icon");
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("should render icon-only button", () => {
    render(FileUploaderButton);

    const iconButton = screen.getByRole("button", {
      name: "Add file icon only",
    });
    expect(iconButton).toHaveClass("bx--btn--icon-only");
    expect(iconButton.querySelector("svg")).toBeInTheDocument();
  });

  it("should render icon-only button with tooltip", () => {
    render(FileUploaderButton);

    const iconButton = screen.getByRole("button", { name: "Tooltip text" });
    expect(iconButton).toHaveClass("bx--btn--icon-only");
    expect(iconButton).toHaveClass("bx--tooltip__trigger");
    expect(iconButton).toHaveClass("bx--tooltip--a11y");
    expect(iconButton).toHaveClass("bx--btn--icon-only--bottom");
    expect(iconButton).toHaveClass("bx--tooltip--align-center");
  });

  it("should hide tooltip but keep accessibility when hideTooltip is true", () => {
    render(FileUploaderButton);

    const iconButton = screen.getByRole("button", {
      name: "Add item hidden tooltip",
    });
    expect(iconButton).toHaveClass("bx--btn--icon-only");

    expect(iconButton).not.toHaveClass("bx--tooltip__trigger");
    expect(iconButton).not.toHaveClass("bx--tooltip--a11y");
    expect(iconButton).not.toHaveClass("bx--btn--icon-only--bottom");
    expect(iconButton).not.toHaveClass("bx--tooltip--align-center");

    const assistiveText = iconButton.querySelector(".bx--assistive-text");
    assert(assistiveText);
    expect(assistiveText).toHaveTextContent("Add item hidden tooltip");
  });

  it("should support icon prop on icon-only button", () => {
    render(FileUploaderButton);

    const buttonWithIcon = screen.getByRole("button", {
      name: "Upload document",
    });
    expect(buttonWithIcon).toHaveClass("bx--btn--icon-only");
    const assistiveText = buttonWithIcon.querySelector(".bx--assistive-text");
    expect(assistiveText).toHaveTextContent("Upload document");
    expect(buttonWithIcon.querySelector("svg")).toBeInTheDocument();
  });

  it("should support custom tooltip position and alignment", () => {
    render(FileUploaderButton);

    const iconButton = screen.getByRole("button", {
      name: "Add file tooltip right",
    });
    expect(iconButton).toHaveClass("bx--btn--icon-only--right");
    expect(iconButton).toHaveClass("bx--tooltip--align-end");
  });

  it("should trigger file input when button with icon is clicked", async () => {
    render(FileUploaderButton);

    const button = screen.getByRole("button", { name: "Upload file" });
    const fileInput = screen.getByLabelText("Upload file");
    assert(fileInput instanceof HTMLInputElement);

    const clickSpy = vi.spyOn(fileInput, "click");

    await user.click(button);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("should trigger file input when icon-only button is clicked", async () => {
    render(FileUploaderButton);

    const button = screen.getByRole("button", { name: "Add file icon only" });
    assert(button);

    const fileInput = button.nextElementSibling;
    assert(fileInput instanceof HTMLInputElement);
    assert(fileInput.type === "file");

    const clickSpy = vi.spyOn(fileInput, "click");
    await user.click(button);

    expect(clickSpy).toHaveBeenCalled();
  });
});
