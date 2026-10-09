import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TagInput from "./TagInput.test.svelte";

const input = () => screen.getByRole("textbox", { name: "Topics" });
const removeButton = (tag: string) =>
  screen.getByRole("button", { name: `Remove ${tag}` });
const shownValue = () =>
  JSON.parse(screen.getByTestId("value").textContent ?? "[]");
const status = () => screen.getByRole("status");
const paste = (text: string) =>
  fireEvent.paste(input(), { clipboardData: { getData: () => text } });

describe("TagInput", () => {
  describe("adding", () => {
    it("adds the trimmed text on Enter and clears the field", async () => {
      const onAdd = vi.fn();
      const onChange = vi.fn();
      render(TagInput, { onAdd, onChange });

      await user.type(input(), "  Svelte  {Enter}");

      expect(shownValue()).toEqual(["Svelte"]);
      expect(input()).toHaveValue("");
      expect(onAdd).toHaveBeenCalledExactlyOnceWith({
        value: "Svelte",
        source: "enter",
      });
      expect(onChange).toHaveBeenCalledExactlyOnceWith(["Svelte"]);
      expect(status()).toHaveTextContent("Svelte added. 1 tag.");
    });

    it("leaves Enter alone when the field is empty", async () => {
      const onAdd = vi.fn();
      render(TagInput, { onAdd });

      input().focus();
      await user.keyboard("{Enter}");

      expect(onAdd).not.toHaveBeenCalled();
    });

    it("splits typed text on the delimiter", async () => {
      render(TagInput);

      await user.type(input(), "css,html,js");

      expect(shownValue()).toEqual(["css", "html"]);
      expect(input()).toHaveValue("js");
    });

    it("accepts several delimiters", async () => {
      render(TagInput, { config: { delimiter: [",", ";"] } });

      await user.type(input(), "a;b,");

      expect(shownValue()).toEqual(["a", "b"]);
    });

    it("splits pasted text on delimiters and line breaks, announcing once", async () => {
      const onAdd = vi.fn();
      render(TagInput, { onAdd });

      input().focus();
      await paste("red, green\nblue");

      expect(shownValue()).toEqual(["red", "green", "blue"]);
      expect(input()).toHaveValue("");
      expect(onAdd).toHaveBeenCalledTimes(3);
      expect(onAdd).toHaveBeenLastCalledWith({
        value: "blue",
        source: "paste",
      });
      expect(status()).toHaveTextContent("3 tags added. 3 tags.");
    });

    it("pastes as plain text when addOnPaste is false", async () => {
      render(TagInput, { config: { addOnPaste: false } });

      input().focus();
      // Not canceled: the browser's own paste goes ahead.
      expect(await paste("red, green")).toBe(true);
      expect(shownValue()).toEqual([]);
    });

    it("adds the text on blur with addOnBlur", async () => {
      render(TagInput, { config: { addOnBlur: true } });

      await user.type(input(), "draft");
      await user.tab();

      expect(shownValue()).toEqual(["draft"]);
    });

    it("ignores Enter while an IME composition is active", async () => {
      render(TagInput);

      await user.type(input(), "日本");
      await fireEvent.keyDown(input(), { key: "Enter", isComposing: true });

      expect(shownValue()).toEqual([]);
      expect(input()).toHaveValue("日本");
    });

    it("applies normalize before checking and adding", async () => {
      render(TagInput, {
        config: { normalize: (raw: string) => raw.trim().toLowerCase() },
      });

      await user.type(input(), "TypeScript{Enter}");

      expect(shownValue()).toEqual(["typescript"]);
    });
  });

  describe("rejecting", () => {
    it("rejects a case-insensitive duplicate and keeps the text", async () => {
      const onInvalid = vi.fn();
      render(TagInput, { value: ["Svelte"], onInvalid });

      await user.type(input(), "svelte{Enter}");

      expect(shownValue()).toEqual(["Svelte"]);
      expect(input()).toHaveValue("svelte");
      expect(input()).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByRole("alert")).toHaveTextContent(
        "This tag has already been added",
      );
      expect(onInvalid).toHaveBeenCalledExactlyOnceWith({
        value: "svelte",
        reason: "duplicate",
        message: undefined,
      });

      // Editing clears the message.
      await user.type(input(), "kit");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("allows duplicates with allowDuplicates", async () => {
      render(TagInput, { value: ["a"], config: { allowDuplicates: true } });

      await user.type(input(), "a{Enter}");

      expect(shownValue()).toEqual(["a", "a"]);
    });

    it("rejects tags past max", async () => {
      const onInvalid = vi.fn();
      render(TagInput, { value: ["a"], config: { max: 1 }, onInvalid });

      await user.type(input(), "b{Enter}");

      expect(shownValue()).toEqual(["a"]);
      expect(screen.getByRole("alert")).toHaveTextContent(
        "You've reached the maximum number of tags",
      );
      expect(onInvalid).toHaveBeenCalledWith(
        expect.objectContaining({ reason: "max" }),
      );
    });

    it("shows the message validate returns", async () => {
      render(TagInput, {
        config: {
          validate: (tag: string) => tag.includes("@") || "Enter an email",
        },
      });

      await user.type(input(), "nope{Enter}");

      expect(shownValue()).toEqual([]);
      expect(screen.getByRole("alert")).toHaveTextContent("Enter an email");

      await user.clear(input());
      await user.type(input(), "a@b.co{Enter}");
      expect(shownValue()).toEqual(["a@b.co"]);
    });

    it("keeps rejected pasted pieces in the field", async () => {
      render(TagInput, { value: ["red"] });

      input().focus();
      await paste("red,green");

      expect(shownValue()).toEqual(["red", "green"]);
      expect(input()).toHaveValue("red");
    });

    it("keeps a tag out when add is canceled", async () => {
      render(TagInput, { cancelAdd: true });

      await user.type(input(), "nope{Enter}");

      expect(shownValue()).toEqual([]);
      expect(input()).toHaveValue("nope");
    });
  });

  describe("removing", () => {
    it("removes a tag from its button and announces it", async () => {
      const onRemove = vi.fn();
      const onChange = vi.fn();
      render(TagInput, { value: ["a", "b", "c"], onRemove, onChange });

      await user.click(removeButton("b"));

      expect(shownValue()).toEqual(["a", "c"]);
      expect(onRemove).toHaveBeenCalledExactlyOnceWith({
        value: "b",
        index: 1,
      });
      expect(onChange).toHaveBeenCalledExactlyOnceWith(["a", "c"]);
      expect(status()).toHaveTextContent("b removed. 2 tags.");
    });

    it("keeps a tag when remove is canceled", async () => {
      render(TagInput, { value: ["a"], cancelRemove: true });

      await user.click(removeButton("a"));

      expect(shownValue()).toEqual(["a"]);
    });

    it("is a single tab stop for all tags", async () => {
      render(TagInput, { value: ["a", "b", "c"] });

      await waitFor(() => {
        expect(removeButton("a")).toHaveAttribute("tabindex", "0");
      });
      expect(removeButton("b")).toHaveAttribute("tabindex", "-1");
      expect(removeButton("c")).toHaveAttribute("tabindex", "-1");
    });
  });

  describe("keyboard", () => {
    it("moves from an empty field to the last tag on Backspace, then deletes it", async () => {
      render(TagInput, { value: ["a", "b"] });

      input().focus();
      await user.keyboard("{Backspace}");
      expect(removeButton("b")).toHaveFocus();
      // Moving there doesn't delete anything.
      expect(shownValue()).toEqual(["a", "b"]);

      await user.keyboard("{Backspace}");
      await tick();
      expect(shownValue()).toEqual(["a"]);
      expect(removeButton("a")).toHaveFocus();
    });

    it("ignores an auto-repeating Backspace at the start of the field", async () => {
      render(TagInput, { value: ["a"] });

      input().focus();
      await fireEvent.keyDown(input(), { key: "Backspace", repeat: true });

      expect(input()).toHaveFocus();
    });

    it("moves to the tags with ArrowLeft only from the start of the text", async () => {
      render(TagInput, { value: ["a"] });

      await user.type(input(), "x");
      await user.keyboard("{ArrowLeft}");
      expect(input()).toHaveFocus();

      await user.keyboard("{ArrowLeft}");
      expect(removeButton("a")).toHaveFocus();
    });

    it("returns to the field from the last tag, End, or Escape", async () => {
      render(TagInput, { value: ["a", "b"] });

      removeButton("b").focus();
      await user.keyboard("{ArrowRight}");
      expect(input()).toHaveFocus();

      removeButton("a").focus();
      await user.keyboard("{ArrowRight}");
      expect(removeButton("b")).toHaveFocus();

      removeButton("a").focus();
      await user.keyboard("{Escape}");
      expect(input()).toHaveFocus();

      removeButton("a").focus();
      await user.keyboard("{End}");
      expect(input()).toHaveFocus();
    });

    it("focuses the field after deleting the only tag", async () => {
      render(TagInput, { value: ["a"] });

      removeButton("a").focus();
      await user.keyboard("{Delete}");
      await tick();
      await tick();

      expect(shownValue()).toEqual([]);
      expect(input()).toHaveFocus();
    });
  });

  describe("forms", () => {
    it("submits each tag as a hidden input under name", () => {
      render(TagInput, { value: ["a", "b"], config: { name: "topics" } });

      const data = new FormData(screen.getByTestId("form") as HTMLFormElement);
      expect(data.getAll("topics")).toEqual(["a", "b"]);
      expect(input()).not.toHaveAttribute("name");
    });

    it("restores the initial tags when the form resets", async () => {
      render(TagInput, { value: ["a"] });

      await user.type(input(), "b{Enter}c");
      expect(shownValue()).toEqual(["a", "b"]);

      (screen.getByTestId("form") as HTMLFormElement).reset();
      await new Promise((resolve) => setTimeout(resolve));
      await tick();

      expect(shownValue()).toEqual(["a"]);
      expect(input()).toHaveValue("");
    });

    it("requires the text input only while there are no tags", async () => {
      render(TagInput, { config: { required: true } });
      expect(input()).toBeRequired();

      await user.type(input(), "a{Enter}");
      expect(input()).not.toBeRequired();
    });
  });

  describe("states", () => {
    it("renders read-only tags without remove buttons", () => {
      render(TagInput, { value: ["a"], config: { readonly: true } });

      expect(screen.getByText("a")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Remove a" }),
      ).not.toBeInTheDocument();
      expect(input()).toHaveAttribute("readonly");
    });

    it("disables the remove buttons when disabled", () => {
      render(TagInput, { value: ["a"], config: { disabled: true } });

      expect(removeButton("a")).toBeDisabled();
      expect(input()).toBeDisabled();
    });

    it("scales tags with the field size", () => {
      render(TagInput, { value: ["a"], config: { size: "xl" } });

      expect(screen.getByText("a").closest(".bx--tag")).toHaveClass(
        "bx--tag--lg",
      );
    });

    it("renders the tags below the field with tagPlacement=below", () => {
      const { container } = render(TagInput, {
        value: ["a"],
        config: { tagPlacement: "below" },
      });

      const field = container.querySelector(".bx--tag-input") as HTMLElement;
      expect(within(field).queryByText("a")).not.toBeInTheDocument();
      expect(
        container.querySelector(".bx--tag-input__tags--below"),
      ).toHaveTextContent("a");
    });

    it("colors tags with tagProps", () => {
      render(TagInput, {
        value: ["urgent"],
        config: { tagProps: () => ({ type: "red" as const }) },
      });

      expect(screen.getByText("urgent").closest(".bx--tag")).toHaveClass(
        "bx--tag--red",
      );
    });

    it("describes the field with the keyboard instructions", () => {
      render(TagInput);

      expect(input()).toHaveAccessibleDescription(/Press Enter to add a tag/);
    });
  });
});
