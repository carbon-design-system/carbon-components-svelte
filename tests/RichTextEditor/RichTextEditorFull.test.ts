import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import RichTextEditorFull from "./RichTextEditorFull.test.svelte";

const CORE_COMMANDS: Array<[string, string]> = [
  ["Undo", "undo"],
  ["Redo", "redo"],
  ["Bold", "bold"],
  ["Italic", "italic"],
  ["Underline", "underline"],
  ["Bulleted list", "insertUnorderedList"],
  ["Numbered list", "insertOrderedList"],
  ["Increase indent", "indent"],
  ["Decrease indent", "outdent"],
  ["Align left", "justifyLeft"],
  ["Align center", "justifyCenter"],
  ["Align right", "justifyRight"],
  ["Justify", "justifyFull"],
];

describe("RichTextEditor core commands", () => {
  it.each(
    CORE_COMMANDS,
  )("%s dispatches the %s command", async (name, command) => {
    const consoleLog = vi.spyOn(console, "log");
    render(RichTextEditorFull);

    await user.click(screen.getByRole("button", { name }));

    expect(
      consoleLog.mock.calls.some(
        ([event, dispatched]) => event === "execute" && dispatched === command,
      ),
    ).toBe(true);
  });

  it("reflects exactly one active alignment", () => {
    render(RichTextEditorFull, { props: { active: ["justifyCenter"] } });

    expect(
      screen.getByRole("button", { name: "Align center" }),
    ).toHaveAttribute("aria-pressed", "true");

    for (const name of ["Align left", "Align right", "Justify"]) {
      expect(screen.getByRole("button", { name })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    }
  });
});
