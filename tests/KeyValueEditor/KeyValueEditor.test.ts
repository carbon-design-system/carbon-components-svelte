import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { flushFormReset } from "../utils/flush-form-reset";
import { user } from "../utils/user";
import KeyValueEditor from "./KeyValueEditor.test.svelte";

const rowsValue = () =>
  JSON.parse(screen.getByTestId("rows").textContent ?? "[]");
const group = (position: number, count: number) =>
  screen.getByRole("group", { name: `Row ${position} of ${count}` });
const keyOf = (position: number, count: number) =>
  within(group(position, count)).getByRole("textbox", { name: "Key" });
const valueOf = (position: number, count: number) =>
  within(group(position, count)).getByRole("textbox", { name: "Value" });
const status = () => screen.getByRole("status");
const addButton = () => screen.getByRole("button", { name: "Add row" });

const three = () => [
  { key: "A", value: "1" },
  { key: "B", value: "2" },
  { key: "C", value: "3" },
];

const paste = (target: HTMLElement, text: string) =>
  fireEvent.paste(target, { clipboardData: { getData: () => text } });

describe("KeyValueEditor", () => {
  describe("rows", () => {
    it("names the group by its label and each row by its position", () => {
      render(KeyValueEditor, { rows: three(), config: { helperText: "Help" } });

      const fieldset = screen.getByRole("group", { name: "Variables" });
      expect(fieldset.tagName).toBe("FIELDSET");
      expect(fieldset).toHaveAccessibleDescription("Help");
      expect(group(2, 3)).toBeInTheDocument();
      expect(valueOf(2, 3)).toHaveValue("2");
    });

    it("assigns new rows, and leaves the objects it was given alone", async () => {
      const original = three();
      render(KeyValueEditor, { rows: original });

      await user.type(keyOf(2, 3), "x");

      expect(rowsValue()[1]).toEqual({ key: "Bx", value: "2" });
      expect(original[1]).toEqual({ key: "B", value: "2" });
    });

    it("dispatches change with the new rows on each edit", async () => {
      const onChange = vi.fn();
      render(KeyValueEditor, { rows: three(), onChange });

      await user.type(valueOf(1, 3), "9");

      expect(onChange).toHaveBeenLastCalledWith([
        { key: "A", value: "19" },
        { key: "B", value: "2" },
        { key: "C", value: "3" },
      ]);
    });

    it("keeps the same input element for a row across edits and moves", async () => {
      render(KeyValueEditor, { rows: three() });
      const input = keyOf(3, 3);

      await user.type(input, "z");
      await user.click(screen.getByRole("button", { name: "Move row 3 up" }));

      expect(keyOf(2, 3)).toBe(input);
      expect(input).toHaveValue("Cz");
    });

    it("shows an empty state, and takes a slot for it", () => {
      render(KeyValueEditor, { rows: [] });

      expect(screen.getByText("No rows yet")).toBeInTheDocument();
      expect(screen.queryByRole("textbox")).toBeNull();
    });

    it("sets the label and column names from props", () => {
      render(KeyValueEditor, {
        rows: [{ key: "A", value: "1" }],
        config: { keyLabel: "Name", valueLabel: "Content", addText: "Add one" },
      });

      expect(
        within(group(1, 1)).getByRole("textbox", { name: "Content" }),
      ).toHaveValue("1");
      expect(screen.getByRole("button", { name: "Add one" })).toBeVisible();
    });
  });

  describe("adding", () => {
    it("adds an empty row, focuses its key and announces it", async () => {
      const onAdd = vi.fn();
      render(KeyValueEditor, { rows: three(), onAdd });

      await user.click(addButton());

      expect(rowsValue()).toHaveLength(4);
      expect(keyOf(4, 4)).toHaveFocus();
      expect(onAdd).toHaveBeenCalledWith({ index: 3, source: "button" });
      expect(status()).toHaveTextContent("Row 4 added. 4 rows.");
    });

    it("lets add be canceled", async () => {
      render(KeyValueEditor, { rows: three(), cancel: "add" });

      await user.click(addButton());

      expect(rowsValue()).toHaveLength(3);
    });

    it("stops at maxRows and says so, without losing focus on the button", async () => {
      render(KeyValueEditor, { rows: three(), config: { maxRows: 3 } });

      addButton().focus();
      await user.click(addButton());

      expect(rowsValue()).toHaveLength(3);
      expect(addButton()).toHaveAttribute("aria-disabled", "true");
      expect(addButton()).toHaveFocus();
      expect(
        screen.getByText("You have reached the maximum number of rows."),
      ).toBeVisible();
    });

    it("has no add controls when read only", () => {
      render(KeyValueEditor, { rows: three(), config: { readonly: true } });

      expect(screen.queryByRole("button", { name: "Add row" })).toBeNull();
      expect(screen.queryByRole("button", { name: /Remove row/ })).toBeNull();
      expect(keyOf(1, 3)).toHaveAttribute("readonly");
    });
  });

  describe("the new-row line", () => {
    const ghost = () => screen.getByRole("group", { name: "Add row" });

    it("shows a line with no row behind it, and no add button", () => {
      render(KeyValueEditor, { rows: [], config: { addMode: "ghost" } });

      expect(ghost()).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Add row" })).toBeNull();
      expect(rowsValue()).toEqual([]);
    });

    it("turns into a row when typed in, keeping focus and the same element", async () => {
      const onAdd = vi.fn();
      render(KeyValueEditor, {
        rows: [{ key: "A", value: "1" }],
        config: { addMode: "ghost" },
        onAdd,
      });
      const input = within(ghost()).getByRole("textbox", { name: "Key" });

      await user.click(input);
      await user.keyboard("NEW");

      expect(rowsValue()).toEqual([
        { key: "A", value: "1" },
        { key: "NEW", value: "" },
      ]);
      expect(keyOf(2, 2)).toBe(input);
      expect(input).toHaveFocus();
      expect(input).toHaveValue("NEW");
      expect(onAdd).toHaveBeenCalledTimes(1);
      expect(onAdd).toHaveBeenCalledWith({ index: 1, source: "ghost" });
      // A new empty line follows.
      expect(ghost()).not.toContainElement(input);
      expect(within(ghost()).getByRole("textbox", { name: "Key" })).toHaveValue(
        "",
      );
    });

    it("posts nothing for the empty line", () => {
      const { container } = render(KeyValueEditor, {
        rows: [{ key: "A", value: "1" }],
        config: { addMode: "ghost", name: "env" },
      });

      expect(
        [...container.querySelectorAll("[name]")].map((el) =>
          el.getAttribute("name"),
        ),
      ).toEqual(["env[0][key]", "env[0][value]"]);
    });
  });

  describe("removing", () => {
    it("moves focus to the key of the next row, then the previous, then Add", async () => {
      const onRemove = vi.fn();
      render(KeyValueEditor, { rows: three(), onRemove });

      await user.click(screen.getByRole("button", { name: "Remove row 2" }));
      expect(rowsValue().map((r: { key: string }) => r.key)).toEqual([
        "A",
        "C",
      ]);
      expect(keyOf(2, 2)).toHaveFocus();
      expect(keyOf(2, 2)).toHaveValue("C");
      expect(onRemove).toHaveBeenCalledWith({
        index: 1,
        row: { key: "B", value: "2" },
      });
      expect(status()).toHaveTextContent("Row 2 removed. 2 rows.");

      await user.click(screen.getByRole("button", { name: "Remove row 2" }));
      expect(keyOf(1, 1)).toHaveFocus();

      await user.click(screen.getByRole("button", { name: "Remove row 1" }));
      await tick();
      expect(addButton()).toHaveFocus();
    });

    it("lets removal be canceled", async () => {
      render(KeyValueEditor, { rows: three(), cancel: "remove" });

      await user.click(screen.getByRole("button", { name: "Remove row 1" }));

      expect(rowsValue()).toHaveLength(3);
    });
  });

  describe("moving", () => {
    const order = () => rowsValue().map((r: { key: string }) => r.key);

    it("moves a row with the buttons, and keeps focus on the button pressed", async () => {
      const onMove = vi.fn();
      render(KeyValueEditor, { rows: three(), onMove });

      await user.click(screen.getByRole("button", { name: "Move row 3 up" }));

      expect(order()).toEqual(["A", "C", "B"]);
      expect(
        screen.getByRole("button", { name: "Move row 2 up" }),
      ).toHaveFocus();
      expect(onMove).toHaveBeenCalledWith({ from: 2, to: 1 });
      expect(status()).toHaveTextContent("Moved to position 2 of 3.");
    });

    it("moves a row with Alt+Shift+Arrow from a field, and keeps focus in it", async () => {
      render(KeyValueEditor, { rows: three() });

      keyOf(1, 3).focus();
      await user.keyboard("{Alt>}{Shift>}{ArrowDown}{/Shift}{/Alt}");

      expect(order()).toEqual(["B", "A", "C"]);
      expect(keyOf(2, 3)).toHaveFocus();
      expect(keyOf(2, 3)).toHaveValue("A");
    });

    it("keeps the first row's up and the last row's down focusable but inert", async () => {
      render(KeyValueEditor, { rows: three() });
      const up = screen.getByRole("button", { name: "Move row 1 up" });

      expect(up).toHaveAttribute("aria-disabled", "true");
      up.focus();
      await user.keyboard("{Enter}");

      expect(order()).toEqual(["A", "B", "C"]);
      expect(up).toHaveFocus();
    });

    it("lets a move be canceled", async () => {
      render(KeyValueEditor, { rows: three(), cancel: "move" });

      await user.click(screen.getByRole("button", { name: "Move row 2 down" }));

      expect(order()).toEqual(["A", "B", "C"]);
    });

    it("has one tab stop for a row's buttons, and arrows move within them", async () => {
      render(KeyValueEditor, { rows: three() });
      const toolbar = screen.getAllByRole("toolbar")[0];
      const buttons = within(toolbar).getAllByRole("button");

      expect(buttons.map((b) => b.getAttribute("tabindex"))).toEqual([
        "-1",
        "0",
        "-1",
        "-1",
      ]);
      buttons[1].focus();
      await user.keyboard("{ArrowRight}");
      expect(buttons[2]).toHaveFocus();
      await user.keyboard("{Tab}");
      expect(buttons[2]).not.toHaveFocus();
    });
  });

  describe("validation", () => {
    it("shows an invalid key once focus leaves the row, not while typing", async () => {
      render(KeyValueEditor, {
        rows: [{ key: "", value: "" }],
        config: { format: "env" },
      });

      await user.type(keyOf(1, 1), "bad key");
      expect(keyOf(1, 1)).not.toHaveAttribute("aria-invalid");

      // Moving to the value stays in the row.
      await user.tab();
      expect(keyOf(1, 1)).not.toHaveAttribute("aria-invalid");

      await user.click(document.body);
      expect(keyOf(1, 1)).toHaveAttribute("aria-invalid", "true");
      expect(keyOf(1, 1)).toHaveAccessibleErrorMessage(
        "Use letters, numbers and underscores, and do not start with a number.",
      );
    });

    it("marks both rows of a repeated key once one is left, and clears both on a fix", async () => {
      render(KeyValueEditor, {
        rows: [
          { key: "A", value: "1" },
          { key: "B", value: "2" },
          { key: "A", value: "3" },
        ],
        config: { format: "env" },
      });

      await user.click(keyOf(3, 3));
      await user.click(document.body);

      expect(keyOf(1, 3)).toHaveAttribute("aria-invalid", "true");
      expect(keyOf(3, 3)).toHaveAttribute("aria-invalid", "true");
      expect(keyOf(2, 3)).not.toHaveAttribute("aria-invalid");
      expect(keyOf(1, 3)).toHaveAccessibleErrorMessage(
        "A is used more than once. Use each key once.",
      );

      await user.type(keyOf(3, 3), "2");
      expect(keyOf(1, 3)).not.toHaveAttribute("aria-invalid");
      expect(keyOf(3, 3)).not.toHaveAttribute("aria-invalid");
    });

    it("matches header names without case, and env keys with it", () => {
      const rows = [
        { key: "Accept", value: "a" },
        { key: "ACCEPT", value: "b" },
      ];
      const headers = render(KeyValueEditor, {
        rows,
        config: { format: "headers" },
      });
      expect(screen.getByTestId("valid")).toHaveTextContent("false");
      headers.unmount();

      render(KeyValueEditor, { rows, config: { format: "env" } });
      expect(screen.getByTestId("valid")).toHaveTextContent("true");
    });

    it("only warns about a repeated key when asked", async () => {
      render(KeyValueEditor, {
        rows: [
          { key: "A", value: "1" },
          { key: "A", value: "2" },
        ],
        config: { duplicateKeys: "warn", format: "env" },
      });

      expect(screen.getByTestId("valid")).toHaveTextContent("true");
      await user.click(keyOf(1, 2));
      await user.click(document.body);
      expect(keyOf(1, 2)).not.toHaveAttribute("aria-invalid");
      expect(screen.getAllByText(/is used more than once/)).toHaveLength(2);
    });

    it("flags a value with no key, and a value that is too long", async () => {
      render(KeyValueEditor, {
        rows: [
          { key: "", value: "orphan" },
          { key: "K", value: "toolong" },
        ],
        config: { maxValueLength: 3 },
      });

      await user.click(keyOf(1, 2));
      await user.click(keyOf(2, 2));
      await user.click(document.body);

      expect(keyOf(1, 2)).toHaveAccessibleErrorMessage(
        "Enter a key for this value.",
      );
      expect(valueOf(2, 2)).toHaveAccessibleErrorMessage(
        "Use 3 characters or fewer in the value.",
      );
    });

    it("takes custom rules, reserved keys and translated messages", async () => {
      render(KeyValueEditor, {
        rows: [
          { key: "PATH", value: "x" },
          { key: "ok", value: "nope" },
        ],
        config: {
          format: "plain",
          reservedKeys: ["PATH"],
          validate: (row) =>
            row.value === "nope" ? { value: "No." } : undefined,
          issueText: (issue, { key }) =>
            issue.code === "key-reserved"
              ? `${key} est réservée`
              : (issue.message ?? ""),
        },
      });

      await user.click(keyOf(1, 2));
      await user.click(keyOf(2, 2));
      await user.click(document.body);

      expect(keyOf(1, 2)).toHaveAccessibleErrorMessage("PATH est réservée");
      expect(valueOf(2, 2)).toHaveAccessibleErrorMessage("No.");
    });

    it("binds valid and issues", async () => {
      render(KeyValueEditor, {
        rows: [{ key: "a b", value: "" }],
        config: { format: "env" },
      });

      expect(screen.getByTestId("valid")).toHaveTextContent("false");
      await user.clear(keyOf(1, 1));
      await user.type(keyOf(1, 1), "AB");
      expect(screen.getByTestId("valid")).toHaveTextContent("true");
    });

    it("lists what to fix on reportValidity, and moves focus to the list", async () => {
      render(KeyValueEditor, {
        rows: [
          { key: "a b", value: "1" },
          { key: "OK", value: "2" },
          { key: "", value: "orphan" },
        ],
        config: { format: "env" },
      });

      await user.click(screen.getByRole("button", { name: "Check rows" }));
      expect(screen.getByTestId("reported")).toHaveTextContent("false");
      await tick();

      const summary = screen.getByRole("group", {
        name: "2 rows need attention",
      });
      expect(summary).toHaveFocus();
      await user.click(
        within(summary).getByRole("button", {
          name: /Row 3 of 3: Enter a key/,
        }),
      );
      expect(keyOf(3, 3)).toHaveFocus();
      expect(keyOf(1, 3)).toHaveAttribute("aria-invalid", "true");
    });

    it("stops a submit before the form's own handlers while rows are invalid, and allows it when they are valid", async () => {
      const onSubmit = vi.fn((e: Event) => e.preventDefault());
      render(KeyValueEditor, {
        rows: [{ key: "bad key", value: "" }],
        config: { format: "env", name: "env" },
      });
      const form = screen.getByTestId("form") as HTMLFormElement;
      form.addEventListener("submit", onSubmit);

      const blocked = new Event("submit", { cancelable: true, bubbles: true });
      form.dispatchEvent(blocked);
      expect(blocked.defaultPrevented).toBe(true);
      expect(onSubmit).not.toHaveBeenCalled();
      await tick();
      expect(
        screen.getByRole("group", { name: "1 row needs attention" }),
      ).toBeVisible();

      await user.clear(keyOf(1, 1));
      await user.type(keyOf(1, 1), "GOOD");
      form.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("lets a form submit with invalid rows when validateOnSubmit is off", () => {
      render(KeyValueEditor, {
        rows: [{ key: "bad key", value: "" }],
        config: { format: "env", validateOnSubmit: false },
      });
      const form = screen.getByTestId("form") as HTMLFormElement;
      const event = new Event("submit", { cancelable: true, bubbles: true });

      form.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
    });

    it("requires a row when required, once a submit is tried", async () => {
      render(KeyValueEditor, { rows: [], config: { required: true } });

      expect(screen.queryByText("Add at least one row.")).toBeNull();
      await user.click(screen.getByRole("button", { name: "Check rows" }));
      expect(screen.getByTestId("reported")).toHaveTextContent("false");
      await tick();
      expect(screen.getByText("Add at least one row.")).toBeVisible();
    });

    it("shows the consumer's invalid text on the group and describes the fieldset by it", () => {
      render(KeyValueEditor, {
        rows: three(),
        config: { invalid: true, invalidText: "Could not save" },
      });

      const message = screen.getByText("Could not save");
      expect(message).toHaveAttribute("role", "alert");
      expect(
        screen.getByRole("group", { name: "Variables" }),
      ).toHaveAccessibleDescription("Could not save");
    });
  });

  describe("pasting", () => {
    const env = 'A=1\nexport B="two words"\n# note\nC=3';

    it("leaves plain text alone", async () => {
      const onPaste = vi.fn();
      render(KeyValueEditor, { rows: [{ key: "", value: "" }], onPaste });

      await paste(keyOf(1, 1), "DATABASE_URL");

      expect(onPaste).not.toHaveBeenCalled();
      expect(screen.queryByText(/Import/)).toBeNull();
    });

    it("asks before turning a pasted .env block into rows, then imports it", async () => {
      const onImport = vi.fn();
      render(KeyValueEditor, {
        rows: [{ key: "", value: "" }],
        config: { format: "env" },
        onImport,
      });

      await paste(keyOf(1, 1), env);
      expect(rowsValue()).toEqual([{ key: "", value: "" }]);
      const prompt = screen.getByRole("group", { name: /Import 3 new rows/ });
      expect(screen.getByRole("button", { name: "Import" })).toHaveFocus();

      await user.click(within(prompt).getByRole("button", { name: "Import" }));

      expect(rowsValue()).toEqual([
        { key: "A", value: "1" },
        { key: "B", value: "two words" },
        { key: "C", value: "3" },
      ]);
      expect(keyOf(1, 3)).toHaveFocus();
      expect(onImport).toHaveBeenCalledWith({
        added: 3,
        updated: 0,
        skipped: 0,
      });
      expect(status()).toHaveTextContent("3 added, 0 updated. 3 rows.");
    });

    it("cancels with the button or Escape and returns focus to the field", async () => {
      render(KeyValueEditor, { rows: [{ key: "", value: "" }] });

      await paste(keyOf(1, 1), env);
      await user.keyboard("{Escape}");
      await tick();

      expect(screen.queryByRole("button", { name: "Import" })).toBeNull();
      expect(rowsValue()).toEqual([{ key: "", value: "" }]);
      expect(keyOf(1, 1)).toHaveFocus();

      await paste(keyOf(1, 1), env);
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(rowsValue()).toEqual([{ key: "", value: "" }]);
    });

    it("updates a key that exists, and counts what is new", async () => {
      render(KeyValueEditor, {
        rows: [
          { key: "A", value: "old" },
          { key: "", value: "" },
        ],
      });

      await paste(keyOf(2, 2), "A=new\nB=2");
      expect(
        screen.getByText("Import 1 new row and 1 existing row updated?"),
      ).toBeVisible();
      await user.click(screen.getByRole("button", { name: "Import" }));

      expect(rowsValue()).toEqual([
        { key: "A", value: "new" },
        { key: "B", value: "2" },
      ]);
    });

    it("reports the lines it cannot read, and imports the rest", async () => {
      render(KeyValueEditor, { rows: [] });

      await paste(addButton(), "A=1");
      expect(screen.queryByRole("button", { name: "Import" })).toBeNull();
      await user.click(addButton());
      await paste(keyOf(1, 1), "A=1\nnot a pair\nB=2");

      expect(screen.getByText(/1 line cannot be imported/)).toBeVisible();
      expect(
        screen.getByText(
          "Line 2: Add an equals sign between the key and the value.",
        ),
      ).toBeVisible();
      await user.click(screen.getByRole("button", { name: "Import" }));
      expect(rowsValue().map((r: { key: string }) => r.key)).toEqual([
        "A",
        "B",
      ]);
    });

    it("imports at once when confirmPaste is off", async () => {
      render(KeyValueEditor, {
        rows: [{ key: "", value: "" }],
        config: { confirmPaste: false },
      });

      await paste(keyOf(1, 1), "A=1\nB=2");

      expect(rowsValue()).toHaveLength(2);
      expect(screen.queryByRole("button", { name: "Import" })).toBeNull();
    });

    it("reads header lines and JSON pasted into a key field", async () => {
      render(KeyValueEditor, {
        rows: [{ key: "", value: "" }],
        config: { format: "headers", confirmPaste: false },
      });

      await paste(keyOf(1, 1), "Accept: text/html\nX-Id: 7");
      expect(rowsValue()).toEqual([
        { key: "Accept", value: "text/html" },
        { key: "X-Id", value: "7" },
      ]);

      await paste(keyOf(2, 2), '{"X-Id": "8", "X-New": "n"}');
      expect(rowsValue()).toEqual([
        { key: "Accept", value: "text/html" },
        { key: "X-Id", value: "8" },
        { key: "X-New", value: "n" },
      ]);
    });

    it("stops a paste at maxRows", async () => {
      render(KeyValueEditor, {
        rows: [{ key: "", value: "" }],
        config: { maxRows: 2, confirmPaste: false },
      });

      await paste(keyOf(1, 1), "A=1\nB=2\nC=3\nD=4");

      expect(rowsValue()).toHaveLength(2);
    });

    it("lets a consumer take over a paste", async () => {
      render(KeyValueEditor, {
        rows: [{ key: "", value: "" }],
        cancel: "paste",
      });

      await paste(keyOf(1, 1), "A=1\nB=2");

      expect(screen.queryByRole("button", { name: "Import" })).toBeNull();
      expect(rowsValue()).toEqual([{ key: "", value: "" }]);
    });

    it("does not import from a value field, or when read only", async () => {
      render(KeyValueEditor, { rows: [{ key: "A", value: "" }] });
      await paste(valueOf(1, 1), "A=1\nB=2");
      expect(screen.queryByRole("button", { name: "Import" })).toBeNull();
    });
  });

  describe("editing as text", () => {
    const toggle = () => screen.getByRole("button", { name: /Edit as/ });
    const area = () => screen.getByRole("textbox", { name: "Rows as text" });

    it("shows the rows as KEY=value lines, comments out disabled ones, and quotes when it has to", async () => {
      render(KeyValueEditor, {
        rows: [
          { key: "A", value: "1" },
          { key: "B", value: "two words", enabled: false },
          { key: "C", value: "x\ny" },
        ],
        config: { format: "env", columns: ["enabled"] },
      });

      await user.click(toggle());

      expect(area()).toHaveValue('A=1\n# B="two words"\nC="x\\ny"');
      expect(toggle()).toHaveTextContent("Edit as rows");
      expect(screen.queryByRole("group", { name: "Row 1 of 3" })).toBeNull();
    });

    it("uses Name: value lines for headers", async () => {
      render(KeyValueEditor, {
        rows: [{ key: "Accept", value: "text/html" }],
        config: { format: "headers" },
      });

      await user.click(toggle());

      expect(area()).toHaveValue("Accept: text/html");
    });

    it("applies the text as rows while it parses, and keeps a row's other fields by key", async () => {
      render(KeyValueEditor, {
        rows: [
          { key: "A", value: "1", secret: true },
          { key: "B", value: "2" },
        ],
        config: { columns: ["secret"], format: "env" },
      });

      await user.click(toggle());
      await user.clear(area());
      await user.type(area(), "B=22{Enter}A=11{Enter}N=n");

      expect(rowsValue()).toEqual([
        { key: "B", value: "22" },
        { key: "A", value: "11", secret: true },
        { key: "N", value: "n" },
      ]);
    });

    it("lists parse errors with their lines, keeps the last good rows, and will not switch back", async () => {
      render(KeyValueEditor, {
        rows: [{ key: "A", value: "1" }],
        config: { format: "env" },
      });

      await user.click(toggle());
      await user.type(area(), "{Enter}oops{Enter}B=2");

      expect(rowsValue()).toEqual([{ key: "A", value: "1" }]);
      expect(area()).toHaveAttribute("aria-invalid", "true");
      expect(
        screen.getByRole("button", {
          name: "Line 2: Add an equals sign between the key and the value.",
        }),
      ).toBeVisible();

      await user.click(toggle());
      expect(area()).toBeVisible();
      expect(status()).toHaveTextContent("1 row needs attention.");

      await user.click(screen.getByRole("button", { name: /Line 2/ }));
      const el = area() as HTMLTextAreaElement;
      expect(el.value.slice(el.selectionStart, el.selectionEnd)).toBe("oops");

      await user.clear(area());
      await user.type(area(), "A=1");
      await user.click(toggle());
      expect(keyOf(1, 1)).toHaveValue("A");
    });

    it("leaves stored secrets out of the text and keeps them", async () => {
      render(KeyValueEditor, {
        rows: [
          { key: "A", value: "1" },
          { key: "S", value: "", stored: true, secret: true },
        ],
        config: { columns: ["secret"], format: "env" },
      });

      await user.click(toggle());
      expect(area()).toHaveValue("A=1");
      await user.type(area(), "{Enter}B=2");

      expect(rowsValue()).toEqual([
        { key: "A", value: "1" },
        { key: "B", value: "2" },
        { key: "S", value: "", stored: true, secret: true },
      ]);
    });

    it("can be removed", () => {
      render(KeyValueEditor, {
        rows: three(),
        config: { bulkEdit: false },
      });

      expect(screen.queryByRole("button", { name: /Edit as/ })).toBeNull();
    });
  });

  describe("secrets", () => {
    it("masks a secret value, and reveals it with the field's own button", async () => {
      render(KeyValueEditor, {
        rows: [{ key: "TOKEN", value: "hunter2", secret: true }],
        config: { columns: ["secret"] },
      });
      const value = within(group(1, 1)).getByLabelText("Value");

      expect(value).toHaveAttribute("type", "password");
      expect(value).toHaveValue("hunter2");
      await user.click(screen.getByRole("button", { name: "Show password" }));
      expect(value).toHaveAttribute("type", "text");
    });

    it("turns masking on and off from the column", async () => {
      render(KeyValueEditor, {
        rows: [{ key: "A", value: "1" }],
        config: { columns: ["secret"] },
      });

      await user.click(screen.getByRole("checkbox", { name: "Secret" }));

      expect(rowsValue()).toEqual([{ key: "A", value: "1", secret: true }]);
      expect(within(group(1, 1)).getByLabelText("Value")).toHaveAttribute(
        "type",
        "password",
      );
    });

    it("never puts a stored secret's value in the document", () => {
      const { container } = render(KeyValueEditor, {
        rows: [{ key: "TOKEN", value: "", stored: true, secret: true }],
        config: { columns: ["secret"], name: "env" },
      });

      expect(within(group(1, 1)).queryByLabelText("Value")).toBeNull();
      expect(screen.getByRole("img", { name: "Stored" })).toHaveTextContent(
        "••••••••",
      );
      expect(
        [...container.querySelectorAll("[name]")]
          .map((el) => el.getAttribute("name"))
          .filter(Boolean),
      ).toEqual(["env[0][key]", "env[0][secret]", "env[0][stored]"]);
    });

    it("replaces a stored secret with a new, empty, masked field and focuses it", async () => {
      render(KeyValueEditor, {
        rows: [{ key: "TOKEN", value: "", stored: true, secret: true }],
        config: { columns: ["secret"] },
      });

      await user.click(
        screen.getByRole("button", { name: "Replace the value of row 1" }),
      );

      const value = within(group(1, 1)).getByLabelText("Value");
      expect(value).toHaveAttribute("type", "password");
      expect(value).toHaveValue("");
      expect(value).toHaveFocus();
      expect(rowsValue()).toEqual([{ key: "TOKEN", value: "", secret: true }]);
    });

    it("does not copy a stored secret, and copies a value otherwise", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        configurable: true,
      });
      render(KeyValueEditor, {
        rows: [
          { key: "A", value: "one" },
          { key: "S", value: "", stored: true, secret: true },
        ],
        config: { columns: ["secret"] },
      });

      await user.click(
        screen.getByRole("button", { name: "Copy the value of row 2" }),
      );
      expect(writeText).not.toHaveBeenCalled();

      await user.click(
        screen.getByRole("button", { name: "Copy the value of row 1" }),
      );
      expect(writeText).toHaveBeenCalledWith("one");
      await tick();
      expect(status()).toHaveTextContent("Copied the value of row 1.");
    });
  });

  describe("columns", () => {
    it("disables a row without removing it", async () => {
      render(KeyValueEditor, {
        rows: [{ key: "A", value: "1" }],
        config: { columns: ["enabled"] },
      });

      await user.click(screen.getByRole("checkbox", { name: "Enabled" }));

      expect(rowsValue()).toEqual([{ key: "A", value: "1", enabled: false }]);
    });

    it("sets a scope from the choices, and lets a key repeat across scopes", async () => {
      render(KeyValueEditor, {
        rows: [
          { key: "A", value: "1", scope: "prod" },
          { key: "A", value: "2", scope: "preview" },
        ],
        config: {
          columns: ["scope"],
          scopes: [
            { id: "prod", text: "Production" },
            { id: "preview", text: "Preview" },
          ],
          format: "env",
        },
      });

      expect(screen.getByTestId("valid")).toHaveTextContent("true");
      await user.selectOptions(
        within(group(2, 2)).getByRole("combobox"),
        "prod",
      );
      expect(rowsValue()[1].scope).toBe("prod");
      expect(screen.getByTestId("valid")).toHaveTextContent("false");
    });

    it("edits a description", async () => {
      render(KeyValueEditor, {
        rows: [{ key: "A", value: "1" }],
        config: { columns: ["description"] },
      });

      await user.type(
        within(group(1, 1)).getByRole("textbox", { name: "Description" }),
        "why",
      );

      expect(rowsValue()[0].description).toBe("why");
    });
  });

  describe("native forms", () => {
    const entries = (form: HTMLFormElement) => [
      ...new FormData(form).entries(),
    ];

    it("posts each row under name[index][field]", () => {
      render(KeyValueEditor, {
        rows: [
          { key: "A", value: "1", secret: true, enabled: false },
          { key: "B", value: "2", scope: "dev", description: "d" },
        ],
        config: {
          name: "env",
          columns: ["enabled", "secret", "scope", "description"],
          scopes: [{ id: "dev", text: "Development" }],
        },
      });

      expect(entries(screen.getByTestId("form") as HTMLFormElement)).toEqual(
        expect.arrayContaining([
          ["env[0][key]", "A"],
          ["env[0][value]", "1"],
          ["env[0][secret]", "1"],
          ["env[0][enabled]", "0"],
          ["env[1][key]", "B"],
          ["env[1][value]", "2"],
          ["env[1][enabled]", "1"],
          ["env[1][scope]", "dev"],
          ["env[1][description]", "d"],
        ]),
      );
    });

    it("posts after moves under the new indexes", async () => {
      render(KeyValueEditor, { rows: three(), config: { name: "env" } });

      await user.click(screen.getByRole("button", { name: "Move row 3 up" }));

      const posted = entries(screen.getByTestId("form") as HTMLFormElement);
      expect(posted).toContainEqual(["env[1][key]", "C"]);
      expect(posted).toContainEqual(["env[2][key]", "B"]);
    });

    it("posts the same rows from the text view", async () => {
      render(KeyValueEditor, {
        rows: [{ key: "A", value: "1" }],
        config: { name: "env" },
      });

      await user.click(screen.getByRole("button", { name: "Edit as text" }));

      expect(entries(screen.getByTestId("form") as HTMLFormElement)).toEqual([
        ["env[0][key]", "A"],
        ["env[0][value]", "1"],
      ]);
    });

    it("puts the rows back on a form reset", async () => {
      render(KeyValueEditor, { rows: three(), config: { name: "env" } });
      await user.click(screen.getByRole("button", { name: "Remove row 1" }));
      expect(rowsValue()).toHaveLength(2);

      (screen.getByTestId("form") as HTMLFormElement).reset();
      await flushFormReset();

      expect(rowsValue()).toEqual(three());
    });

    it("disables every control inside a disabled fieldset, and shows no messages", () => {
      render(KeyValueEditor, {
        rows: [{ key: "bad key", value: "" }],
        config: { disabled: true, format: "env" },
      });

      expect(keyOf(1, 1)).toBeDisabled();
      expect(screen.getByRole("button", { name: "Add row" })).toBeDisabled();
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });

  describe("export", () => {
    const readText = (blob: Blob) =>
      new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsText(blob);
      });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("downloads the enabled rows as .env or JSON", async () => {
      const blobs: Blob[] = [];
      const names: string[] = [];
      URL.createObjectURL = vi.fn((blob: Blob) => {
        blobs.push(blob);
        return "blob:x";
      }) as typeof URL.createObjectURL;
      URL.revokeObjectURL = vi.fn();
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
        function (this: HTMLAnchorElement) {
          names.push(this.download);
        },
      );
      render(KeyValueEditor, {
        rows: [
          { key: "A", value: "1" },
          { key: "B", value: "2", enabled: false },
        ],
        config: { format: "env", columns: ["enabled"] },
      });

      await user.click(screen.getByRole("button", { name: "Export" }));
      await user.click(screen.getByRole("menuitem", { name: ".env" }));
      await user.click(screen.getByRole("button", { name: "Export" }));
      await user.click(screen.getByRole("menuitem", { name: "JSON" }));

      expect(names).toEqual(["variables.env", "variables.json"]);
      expect(await readText(blobs[0])).toBe("A=1");
      expect(JSON.parse(await readText(blobs[1]))).toEqual({ A: "1" });
    });
  });
});
