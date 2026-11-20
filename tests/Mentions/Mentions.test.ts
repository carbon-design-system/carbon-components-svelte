import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import Mentions from "./Mentions.test.svelte";

async function typeInto(text: string, role = "textbox") {
  const field = screen.getByRole(role);
  await user.click(field);
  await user.keyboard(text);
  await tick();
  return field as HTMLTextAreaElement;
}

describe("Mentions", () => {
  it("opens on a trigger, filters, and wires the field to the menu", async () => {
    render(Mentions);
    const field = await typeInto("hi @ali");

    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent?.trim())).toEqual([
      "Alice Smith",
      "Alina Jones",
    ]);
    expect(field).toHaveAttribute("aria-autocomplete", "list");
    expect(field).toHaveAttribute(
      "aria-controls",
      screen.getByRole("listbox").id,
    );
    expect(field).toHaveAttribute("aria-activedescendant", options[0].id);
    expect(field).not.toHaveAttribute("aria-expanded");
    expect(field).not.toHaveAttribute("role");
  });

  it("opens nothing in an address or after a space", async () => {
    render(Mentions);
    await typeInto("mail a@ali");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.keyboard(" and @ali ");
    await tick();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("accepts with Enter, writes the text and records the mention", async () => {
    const onSelect = vi.fn();
    render(Mentions, { props: { onSelect } });
    const field = await typeInto("hi @al");

    await user.keyboard("{ArrowDown}{Enter}");
    await tick();

    expect(field.value).toBe("hi @Alina Jones ");
    expect(field.selectionStart).toBe(field.value.length);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: "@",
        item: expect.objectContaining({ id: "u2" }),
        mention: {
          trigger: "@",
          id: "u2",
          text: "Alina Jones",
          start: 3,
          end: 15,
        },
      }),
    );
  });

  it("closes on Escape without clearing the text, and keeps the key from a parent", async () => {
    render(Mentions);
    const field = await typeInto("@ali");
    const parent = vi.fn();
    document.body.addEventListener("keydown", parent);

    await user.keyboard("{Escape}");
    await tick();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(field.value).toBe("@ali");
    expect(parent).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    expect(parent).toHaveBeenCalledTimes(1);
    document.body.removeEventListener("keydown", parent);
  });

  it("does nothing during an IME composition", async () => {
    render(Mentions);
    const field = await typeInto("@");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await fireEvent.compositionStart(field);
    await tick();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    field.value = "@bo";
    field.setSelectionRange(3, 3);
    await fireEvent.input(field, { isComposing: true });
    await tick();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await fireEvent.compositionEnd(field);
    await tick();
    expect(
      screen.getByRole("option", { name: "Bob Brown" }),
    ).toBeInTheDocument();
  });

  it("ignores Enter that belongs to the IME", async () => {
    render(Mentions);
    const field = await typeInto("@ali");
    const enter = new KeyboardEvent("keydown", {
      key: "Enter",
      keyCode: 229,
      bubbles: true,
      cancelable: true,
    });
    field.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(false);
    expect(field.value).toBe("@ali");
  });

  it("works in a TextInput", async () => {
    render(Mentions, { props: { input: true } });
    const field = (await typeInto("@bo")) as unknown as HTMLInputElement;
    await user.keyboard("{Enter}");
    await tick();
    expect(field.value).toBe("@Bob Brown ");
  });

  it('tracks a "text" mention through edits and drops one that is changed', async () => {
    render(Mentions);
    const read = () =>
      JSON.parse(screen.getByTestId("mentions").textContent ?? "");
    const field = await typeInto("@ali{Enter}");
    await tick();
    expect(read()).toEqual([
      { trigger: "@", id: "u1", text: "Alice Smith", start: 0, end: 12 },
    ]);

    // Text typed before it moves it.
    field.setSelectionRange(0, 0);
    await user.keyboard(">");
    await tick();
    expect(read()[0]).toMatchObject({ start: 1, end: 13 });

    // Text typed after it leaves it alone.
    field.setSelectionRange(field.value.length, field.value.length);
    await user.keyboard("thanks");
    await tick();
    expect(read()[0]).toMatchObject({ start: 1, end: 13 });

    // A character changed inside it drops it.
    field.setSelectionRange(8, 8);
    await user.keyboard("{Backspace}");
    await tick();
    expect(read()).toEqual([]);
  });

  it("opens again when a character is deleted back into a mention", async () => {
    render(Mentions, {
      props: {
        triggers: [
          {
            char: "@",
            allowSpaces: true,
            items: [{ id: "u1", text: "Alice Smith" }],
          },
        ],
      },
    });
    const field = await typeInto("@ali");
    await user.keyboard("{Enter}");
    await tick();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.keyboard("{Backspace}");
    await tick();
    expect(field.value).toBe("@Alice Smith");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("uses a function source and drops an answer a newer query replaced", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const pending: Array<(items: unknown[]) => void> = [];
    const items = vi.fn(
      (_query: string, _context: { signal: AbortSignal }) =>
        new Promise<{ id: string; text: string }[]>((resolve) => {
          pending.push((list) =>
            resolve(list as { id: string; text: string }[]),
          );
        }),
    );
    render(Mentions, {
      props: { triggers: [{ char: "#", items, debounce: 0 }] },
    });
    await typeInto("#a");
    await user.keyboard("b");
    await tick();
    // The bare trigger asks for "" too.
    expect(items.mock.calls.map((call) => call[0])).toEqual(["", "a", "ab"]);
    expect(items.mock.calls.map((call) => call[1].signal.aborted)).toEqual([
      true,
      true,
      false,
    ]);

    pending[2]([{ id: "2", text: "second" }]);
    await vi.advanceTimersByTimeAsync(0);
    pending[1]([{ id: "1", text: "first" }]);
    await vi.advanceTimersByTimeAsync(0);
    await tick();

    expect(
      screen.getAllByRole("option").map((o) => o.textContent?.trim()),
    ).toEqual(["second"]);
    vi.useRealTimers();
  });

  it("removes what it added to the field when the field changes", async () => {
    const { rerender } = render(Mentions);
    const field = screen.getByRole("textbox");
    expect(field).toHaveAttribute("aria-autocomplete", "list");
    await rerender({ input: true });
    await tick();
    expect(field).not.toHaveAttribute("aria-autocomplete");
    expect(document.querySelectorAll(".bx--mentions__anchor")).toHaveLength(1);
  });
});
