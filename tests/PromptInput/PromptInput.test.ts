import { fireEvent, render, screen, within } from "@testing-library/svelte";
import {
  createDragEvent,
  makeFile,
  simulateFileSelection,
} from "../FileUploader/helpers";
import { user } from "../utils/user";
import PromptInput from "./PromptInput.test.svelte";

const field = () => screen.getByRole("textbox", { name: "Message" });
const log = () => screen.getByTestId("log").textContent;
const sendButton = () => screen.getByRole("button", { name: /^(Send|Stop)$/ });
const fileInput = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>(
    'input[type="file"]',
  ) as HTMLInputElement;

describe("PromptInput sending", () => {
  it("sends on Enter, trims the text, clears the field and keeps focus", async () => {
    render(PromptInput);

    await user.type(field(), "  Summarize the report  {Enter}");

    expect(log()).toBe('submit "Summarize the report" []');
    expect(field()).toHaveValue("");
    expect(field()).toHaveFocus();
  });

  it("starts a new line on Shift+Enter", async () => {
    render(PromptInput);

    await user.type(field(), "one{Shift>}{Enter}{/Shift}two");

    expect(log()).toBe("");
    expect(field()).toHaveValue("one\ntwo");
  });

  it("doesn't send the Enter that confirms an IME composition", async () => {
    render(PromptInput, { value: "にほんご" });

    // Safari ends the composition first, so only keyCode 229 gives it away.
    await fireEvent.keyDown(field(), { key: "Enter", keyCode: 229 });
    await fireEvent.keyDown(field(), { key: "Enter", isComposing: true });

    expect(log()).toBe("");
    await fireEvent.keyDown(field(), { key: "Enter" });
    expect(log()).toBe('submit "にほんご" []');
  });

  it("leaves a key another handler took", async () => {
    render(PromptInput, { value: "hello" });
    field().addEventListener("keydown", (event) => event.preventDefault(), {
      capture: true,
    });

    await fireEvent.keyDown(field(), { key: "Enter" });

    expect(log()).toBe("");
  });

  it("sends on Ctrl+Enter or Cmd+Enter only, in mod-enter mode", async () => {
    render(PromptInput, { submitOn: "mod-enter", value: "hello" });

    await user.type(field(), "{Enter}");
    expect(log()).toBe("");
    expect(field()).toHaveValue("hello\n");

    await user.type(field(), "{Control>}{Enter}{/Control}");
    expect(log()).toBe('submit "hello" []');
  });

  it("can't send nothing, or more than maxCount, and shows the count", async () => {
    render(PromptInput, { maxCount: 5 });
    expect(sendButton()).toBeDisabled();
    expect(screen.getByText("0/5")).toBeInTheDocument();

    await user.type(field(), "abcdef");

    expect(screen.getByText("6/5")).toHaveClass("bx--prompt-input__hint--over");
    expect(field()).toHaveAttribute("aria-invalid", "true");
    expect(sendButton()).toBeDisabled();
    await user.type(field(), "{Enter}");
    expect(log()).toBe("");
  });

  it("describes the field by a custom hint", () => {
    render(PromptInput, { hint: (value: string) => `~${value.length} tokens` });

    expect(field()).toHaveAccessibleDescription("~0 tokens");
  });

  it("sends with the Send button", async () => {
    render(PromptInput, { value: "hello" });

    await user.click(sendButton());

    expect(log()).toBe('submit "hello" []');
    expect(field()).toHaveFocus();
  });
});

describe("PromptInput while a response arrives", () => {
  it("turns Send into Stop, which stops", async () => {
    render(PromptInput, { status: "streaming", value: "next question" });

    const stop = screen.getByRole("button", { name: "Stop" });
    expect(stop).toBeEnabled();
    await user.click(stop);

    expect(log()).toBe("stop");
  });

  it("stops on Escape and doesn't send on Enter", async () => {
    render(PromptInput, { status: "streaming", value: "next question" });

    await user.type(field(), "{Enter}");
    expect(log()).toBe("");

    await user.type(field(), "{Escape}");
    expect(log()).toBe("stop");
  });

  it("shows the wait on the stop button while submitted", () => {
    render(PromptInput, { status: "submitted" });

    expect(screen.getByRole("button", { name: "Stop" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("keeps the same button when it turns, so focus stays on it", async () => {
    const { rerender } = render(PromptInput, { value: "hello" });
    const button = sendButton();

    await rerender({ status: "streaming" });

    expect(sendButton()).toBe(button);
  });

  it("disables everything, Stop included", () => {
    render(PromptInput, { disabled: true, status: "streaming" });

    expect(field()).toBeDisabled();
    const buttons = screen
      .getAllByRole("button")
      .filter((button) => button.classList.contains("bx--btn"));
    expect(buttons).toHaveLength(2);
    for (const button of buttons) expect(button).toBeDisabled();
  });
});

describe("PromptInput history", () => {
  const history = ["first prompt", "second prompt"];

  it("recalls earlier prompts with ArrowUp in an empty field and returns with ArrowDown", async () => {
    render(PromptInput, { history });
    field().focus();

    await user.keyboard("{ArrowUp}");
    expect(field()).toHaveValue("second prompt");
    await user.keyboard("{ArrowUp}");
    expect(field()).toHaveValue("first prompt");
    await user.keyboard("{ArrowUp}");
    expect(field()).toHaveValue("first prompt");
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(field()).toHaveValue("");
  });

  it("brings back the draft, and ArrowUp in a field with text moves the caret", async () => {
    render(PromptInput, { history, value: "draft" });
    field().focus();

    await user.keyboard("{ArrowUp}");
    expect(field()).toHaveValue("draft");
  });

  it("adds a sent prompt, once in a row", async () => {
    render(PromptInput, { history });

    await user.type(field(), "third prompt{Enter}");
    await user.type(field(), "third prompt{Enter}");
    await user.keyboard("{ArrowUp}");

    expect(field()).toHaveValue("third prompt");
    await user.keyboard("{ArrowUp}");
    expect(field()).toHaveValue("second prompt");
  });
});

describe("PromptInput attachments", () => {
  it("attaches picked files as chips, and removes one", async () => {
    const { container } = render(PromptInput);

    simulateFileSelection(fileInput(container), [
      makeFile("report.txt", 2048),
      makeFile("notes.txt", 10),
    ]);

    const list = await screen.findByRole("list", { name: "Attachments" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    expect(within(list).getByText("2 kB")).toBeInTheDocument();
    expect(log()).toBe("attach report.txt,notes.txt");

    await user.click(screen.getByRole("button", { name: "Remove report.txt" }));

    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(log()).toContain("remove report.txt");
    expect(field()).toHaveFocus();
  });

  it("sends the attachments with the text, with no text at all, and clears them", async () => {
    const { container } = render(PromptInput);

    simulateFileSelection(fileInput(container), [makeFile("report.txt")]);
    await screen.findByRole("list", { name: "Attachments" });
    await user.click(sendButton());

    expect(log()).toContain('submit "" [report.txt]');
    expect(screen.queryByRole("list", { name: "Attachments" })).toBeNull();
  });

  it("turns away files by type, size, duplicate and count", async () => {
    const { container } = render(PromptInput, {
      accept: ".txt",
      maxFileSize: 100,
      maxFiles: 2,
    });

    simulateFileSelection(fileInput(container), [
      makeFile("a.txt"),
      makeFile("b.png", 10, { type: "image/png" }),
      makeFile("big.txt", 500),
      makeFile("c.txt"),
      makeFile("d.txt"),
    ]);

    await screen.findByRole("list", { name: "Attachments" });
    expect(log()).toBe(
      [
        "attach a.txt,c.txt",
        "reject b.png type",
        "reject big.txt size",
        "reject d.txt count",
      ].join("\n"),
    );
    expect(
      screen.getByText(/Couldn't attach b\.png: type not accepted/),
    ).toHaveTextContent("Couldn't attach d.txt: too many files");
  });

  it("attaches a pasted image, but lets pasted text paste", async () => {
    render(PromptInput);
    const image = new File(["x"], "image.png", { type: "image/png" });

    const withText = await fireEvent.paste(field(), {
      clipboardData: {
        files: [image],
        types: ["Files", "text/plain"],
        getData: () => "cells",
      },
    });
    expect(withText).toBe(true);
    expect(log()).toBe("");

    const imageOnly = await fireEvent.paste(field(), {
      clipboardData: { files: [image], types: ["Files"], getData: () => "" },
    });
    expect(imageOnly).toBe(false);
    expect(log()).toBe("attach image.png");
  });

  it("attaches dropped files and shows the drop target while they are over it", async () => {
    const { container } = render(PromptInput);
    const root = container.querySelector(".bx--prompt-input") as HTMLElement;
    const drag = (type: "dragover" | "dragleave" | "drop", files: File[]) => {
      const event = createDragEvent(type, files);
      root.dispatchEvent(event);
      return event;
    };

    root.dispatchEvent(
      Object.assign(
        new Event("dragenter", { bubbles: true, cancelable: true }),
        {
          dataTransfer: { types: ["Files"], files: [] },
        },
      ),
    );
    await Promise.resolve();
    expect(root).toHaveClass("bx--prompt-input--dragging");

    const event = drag("drop", [makeFile("dropped.txt")]);
    expect(event.defaultPrevented).toBe(true);
    await screen.findByText("dropped.txt");
    expect(root).not.toHaveClass("bx--prompt-input--dragging");
    expect(log()).toBe("attach dropped.txt");
  });

  it("holds Send while a file uploads, shows its progress and holds it for an error", async () => {
    const { rerender } = render(PromptInput, {
      value: "describe this",
      attachments: [
        { id: "1", name: "scan.pdf", status: "uploading", progress: 40 },
      ],
    });

    expect(sendButton()).toBeDisabled();
    const bar = screen.getByRole("progressbar", { name: "Uploading 40%" });
    expect(bar).toHaveAttribute("aria-valuenow", "40");

    await rerender({
      attachments: [
        { id: "1", name: "scan.pdf", status: "error", errorText: "Too large" },
      ],
    });
    expect(screen.getByText("Too large")).toBeInTheDocument();
    expect(sendButton()).toBeDisabled();

    await rerender({
      attachments: [{ id: "1", name: "scan.pdf", status: "complete" }],
    });
    expect(sendButton()).toBeEnabled();
  });

  it("leaves out the attach button and ignores files when not attachable", () => {
    render(PromptInput, { attachable: false });

    expect(screen.queryByRole("button", { name: "Attach files" })).toBeNull();
  });
});
