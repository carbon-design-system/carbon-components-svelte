import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import InlineSuggest from "./InlineSuggest.test.svelte";

const ghost = () =>
  document.querySelector(".bx--inline-suggest__ghost")?.textContent ?? "";

async function typeInto(text: string, name = "Email") {
  const field = screen.getByRole("textbox", { name });
  await user.click(field);
  await user.keyboard(text);
  await tick();
  return field as HTMLInputElement;
}

describe("InlineSuggest", () => {
  it("shows the rest of a candidate after the caret and marks the field", async () => {
    render(InlineSuggest);
    const field = await typeInto("ada@gm");

    expect(ghost()).toBe("ail.com");
    expect(field).toHaveAttribute("aria-autocomplete", "inline");
    expect(field.getAttribute("aria-describedby")).toContain("-hint");
    expect(
      document.querySelector(".bx--inline-suggest__layer"),
    ).toHaveAttribute("aria-hidden", "true");
    expect(field.value).toBe("ada@gm");
  });

  it("keeps the hint through the field's own description changing", async () => {
    const { rerender } = render(InlineSuggest, {
      props: { helperText: "Work email" },
    });
    const field = await typeInto("ada@gm");
    const hintId = field
      .getAttribute("aria-describedby")
      ?.split(" ")
      .find((id) => id.endsWith("-hint"));
    expect(hintId).toBeTruthy();
    expect(document.getElementById(hintId as string)).toHaveTextContent(
      /Tab or Right Arrow accepts/,
    );

    await rerender({ helperText: "Use your work address" });
    await tick();
    await Promise.resolve();
    expect(field.getAttribute("aria-describedby")).toContain(hintId);
  });

  it("types through the suggestion without a new one, until it stops matching", async () => {
    render(InlineSuggest);
    await typeInto("ada@g");
    expect(ghost()).toBe("mail.com");

    await user.keyboard("m");
    expect(ghost()).toBe("ail.com");
    await user.keyboard("a");
    expect(ghost()).toBe("il.com");

    await user.keyboard("{Backspace}{Backspace}i");
    expect(ghost()).toBe("thub.com");
  });

  it("accepts with Tab, and the next Tab moves focus on", async () => {
    const onAccept = vi.fn();
    render(InlineSuggest, { props: { onAccept } });
    const field = await typeInto("ada@gm");

    await user.keyboard("{Tab}");
    await tick();
    expect(field.value).toBe("ada@gmail.com");
    expect(ghost()).toBe("");
    expect(field).toHaveFocus();
    expect(onAccept).toHaveBeenCalledWith({
      text: "ail.com",
      kind: "all",
      key: "Tab",
    });

    await user.keyboard("{Tab}");
    expect(screen.getByLabelText("Next")).toHaveFocus();
  });

  it("accepts a word at a time with Ctrl+Right", async () => {
    render(InlineSuggest, {
      props: {
        multiline: true,
        source: () => " the quick brown fox",
        after: "",
      },
    });
    const field = await typeInto("Over", "Message");
    await new Promise((resolve) => setTimeout(resolve, 200));
    await tick();
    expect(ghost()).toBe(" the quick brown fox");

    await user.keyboard("{Control>}{ArrowRight}{/Control}");
    await tick();
    expect(field.value).toBe("Over the");
    expect(ghost()).toBe(" quick brown fox");
  });

  it("leaves Tab alone when it is not an accept key", async () => {
    render(InlineSuggest, { props: { acceptKeys: ["ArrowRight"] } });
    const field = await typeInto("ada@gm");

    await user.keyboard("{Tab}");
    expect(field.value).toBe("ada@gm");
    expect(screen.getByLabelText("Next")).toHaveFocus();
  });

  it("dismisses with Escape, keeps the key from a parent, and returns on the next key", async () => {
    const onDismiss = vi.fn();
    const onKeydown = vi.fn();
    render(InlineSuggest, { props: { onDismiss } });
    const field = await typeInto("ada@g");
    document.body.addEventListener("keydown", onKeydown);

    await user.keyboard("{Escape}");
    expect(ghost()).toBe("");
    expect(onDismiss).toHaveBeenCalledWith({ suggestion: "mail.com" });
    expect(onKeydown).not.toHaveBeenCalled();
    expect(field.value).toBe("ada@g");

    await user.keyboard("m");
    expect(ghost()).toBe("ail.com");
    document.body.removeEventListener("keydown", onKeydown);
  });

  it("offers nothing with the caret off the end or during composition", async () => {
    render(InlineSuggest);
    const field = await typeInto("ada@gm");
    expect(ghost()).toBe("ail.com");

    await user.keyboard("{ArrowLeft}");
    expect(ghost()).toBe("");
    await user.keyboard("{ArrowRight}");
    expect(ghost()).toBe("ail.com");

    field.dispatchEvent(new CompositionEvent("compositionstart"));
    await tick();
    expect(ghost()).toBe("");
    field.dispatchEvent(new CompositionEvent("compositionend"));
    await tick();
    expect(ghost()).toBe("ail.com");
  });

  it("uses only the answer to the newest text from an async source", async () => {
    const resolvers: Record<string, (text: string) => void> = {};
    const source = (value: string) =>
      new Promise<string>((resolve) => {
        resolvers[value] = resolve;
      });
    render(InlineSuggest, { props: { source, after: "" } });
    const field = await typeInto("he");
    await new Promise((resolve) => setTimeout(resolve, 200));
    await user.keyboard("l");
    await new Promise((resolve) => setTimeout(resolve, 200));

    resolvers.hel("p me");
    resolvers.he?.("llo");
    await tick();
    await Promise.resolve();
    expect(ghost()).toBe("p me");
    expect(field.value).toBe("hel");
  });
});
