import { render, screen } from "@testing-library/svelte";
import {
  ALL_COMMANDS,
  TOGGLE_COMMANDS,
} from "../../src/RichTextEditor/commands.js";
import { user } from "../utils/user";
import RichTextEditor from "./RichTextEditor.test.svelte";

describe("RichTextEditor", () => {
  it("provides editor context to children", () => {
    render(RichTextEditor);

    expect(screen.getByTestId("dispatch")).toBeInTheDocument();
    expect(screen.getByTestId("disabled")).toHaveTextContent("false");
  });

  it("dispatch is a no-op when no surface is registered", async () => {
    render(RichTextEditor);

    await user.click(screen.getByTestId("dispatch"));

    expect(screen.getByTestId("active")).toHaveTextContent("");
  });

  it("reflects disabled into context", () => {
    render(RichTextEditor, { props: { disabled: true } });

    expect(screen.getByTestId("disabled")).toHaveTextContent("true");
  });

  it("setValue updates value and dispatches change", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(RichTextEditor);

    await user.click(screen.getByTestId("set"));

    expect(
      consoleLog.mock.calls.some(
        ([event, detail]) => event === "change" && detail === "<p>hi</p>",
      ),
    ).toBe(true);
  });

  describe("command vocabulary", () => {
    it("exposes the v1 toggle and full command sets", () => {
      expect(TOGGLE_COMMANDS).toContain("bold");
      expect(TOGGLE_COMMANDS).toContain("insertOrderedList");
      expect(ALL_COMMANDS).toEqual(
        expect.arrayContaining([
          ...TOGGLE_COMMANDS,
          "indent",
          "outdent",
          "createLink",
          "unlink",
          "undo",
          "redo",
        ]),
      );
    });
  });
});
