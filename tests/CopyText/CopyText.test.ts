import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import CopyTextMultiple from "./CopyText.multiple.test.svelte";
import CopyText from "./CopyText.test.svelte";

describe("CopyText", () => {
  const writeText = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      writable: true,
    });
  });

  afterEach(() => {
    for (const portal of document.querySelectorAll("[data-floating-portal]")) {
      portal.remove();
    }
  });

  it("renders the text inline beside a copy button", () => {
    render(CopyText, { props: { text: "f8a2c91d" } });

    const root = screen.getByTestId("copy-text");
    expect(root.tagName).toBe("SPAN");
    expect(root).toHaveClass("bx--copy-text");
    expect(root.querySelector(".bx--copy-text__value")).toHaveTextContent(
      "f8a2c91d",
    );
    expect(
      screen.getByRole("button", { name: "Copy to clipboard" }),
    ).toBeInTheDocument();
  });

  it("copies `text` and dispatches copy", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(CopyText, { props: { text: "f8a2c91d" } });

    await user.click(screen.getByRole("button"));

    expect(writeText).toHaveBeenCalledWith("f8a2c91d");
    expect(consoleLog).toHaveBeenCalledWith("copied");
  });

  it("copies the trimmed slot content when text is unset", async () => {
    render(CopyText, { props: { useSlot: true } });

    await user.click(screen.getByRole("button"));

    expect(writeText).toHaveBeenCalledWith("slotted value");
  });

  it("prefers text over slot content when both are set", async () => {
    render(CopyText, { props: { useSlot: true, text: "override" } });

    await user.click(screen.getByRole("button"));

    expect(writeText).toHaveBeenCalledWith("override");
  });

  it("uses a custom copy function", async () => {
    const copy = vi.fn();
    render(CopyText, { props: { text: "abc", copy } });

    await user.click(screen.getByRole("button"));

    expect(copy).toHaveBeenCalledWith("abc");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("dispatches copy:error when copying fails", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(CopyText, {
      props: {
        text: "abc",
        copy: () => Promise.reject(new Error("nope")),
      },
    });

    await user.click(screen.getByRole("button"));

    expect(consoleLog).toHaveBeenCalledWith("copy-error");
  });

  it("exposes ref to the root element", () => {
    const { component } = render(CopyText, { props: { text: "abc" } });

    expect(component.ref).toBe(screen.getByTestId("copy-text"));
  });

  it("copies the text content of rich slot markup", async () => {
    render(CopyText, { props: { richSlot: true } });

    await user.click(screen.getByRole("button"));

    expect(writeText).toHaveBeenCalledWith("host:5432");
  });

  it("copies an empty string when there is no value", async () => {
    render(CopyText);

    await user.click(screen.getByRole("button"));

    expect(writeText).toHaveBeenCalledWith("");
  });

  it("reads the current text at click time", async () => {
    const { component } = render(CopyText, { props: { text: "before" } });

    component.text = "after";
    await user.click(screen.getByRole("button"));

    expect(writeText).toHaveBeenCalledWith("after");
  });

  it("labels the button with iconDescription", () => {
    render(CopyText, {
      props: { text: "abc", extra: { iconDescription: "Copy endpoint" } },
    });

    expect(
      screen.getByRole("button", { name: "Copy endpoint" }),
    ).toBeInTheDocument();
  });

  it("shows feedback in the tooltip after copying", async () => {
    render(CopyText, {
      props: { text: "abc", extra: { feedback: "Endpoint copied" } },
    });

    await user.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(
        document.querySelector("[data-floating-portal]"),
      ).toHaveTextContent("Endpoint copied"),
    );
  });

  it("shows errorFeedback when copying fails", async () => {
    render(CopyText, {
      props: {
        text: "abc",
        copy: () => Promise.reject(new Error("nope")),
        extra: { errorFeedback: "Could not copy" },
      },
    });

    await user.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(
        document.querySelector("[data-floating-portal]"),
      ).toHaveTextContent("Could not copy"),
    );
  });

  it("copies with the keyboard", async () => {
    render(CopyText, { props: { text: "abc" } });

    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(writeText).toHaveBeenCalledWith("abc");
  });

  it("merges restProps and keeps the root class", () => {
    render(CopyText, {
      props: {
        text: "abc",
        extra: { class: "custom", id: "endpoint", title: "Endpoint" },
      },
    });

    const root = screen.getByTestId("copy-text");
    expect(root).toHaveClass("custom", "bx--copy-text");
    expect(root).toHaveAttribute("id", "endpoint");
    expect(root).toHaveAttribute("title", "Endpoint");
  });

  it("copies from the clicked instance only", async () => {
    render(CopyTextMultiple);

    await user.click(screen.getByRole("button", { name: "Copy second" }));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith("second");
  });
});
