import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import MergeResolver from "./MergeResolver.test.svelte";

const lines = (...rows: string[]) => `${rows.join("\n")}\n`;

const base = lines("a", "b", "c", "d", "e", "f", "g");
const ours = lines("a", "b", "ours1", "d", "e", "ours2", "g");
const theirs = lines("a", "b", "theirs1", "d", "e", "theirs2", "g");

const result = () => screen.getByTestId("result").textContent;
const textarea = () => screen.getByRole<HTMLTextAreaElement>("textbox");
const toolbar = () =>
  within(screen.getByRole("group", { name: "Conflict actions" }));
const status = () => screen.getByRole("status");
const summary = () =>
  document
    .querySelector(".bx--merge-resolver__status")
    ?.textContent?.replace(/\s+/g, " ")
    .trim();

/** Types into the result the way the browser does: set the text, then `input`. */
async function type(next: string, caret?: number) {
  const area = textarea();
  area.value = next;
  area.setSelectionRange(caret ?? next.length, caret ?? next.length);
  await fireEvent.input(area);
}

function setup(props: Record<string, unknown> = {}) {
  const onResolve = vi.fn();
  const onChange = vi.fn();
  const view = render(MergeResolver, {
    props: { base, ours, theirs, onResolve, onChange, ...props },
  });
  return { ...view, onResolve, onChange };
}

describe("MergeResolver", () => {
  it("shows git markers for each conflict and how many are left", () => {
    setup();

    expect(result()).toContain(
      lines("<<<<<<<", "ours1", "=======", "theirs1", ">>>>>>>"),
    );
    expect(textarea()).toHaveValue(result());
    expect(summary()).toBe("Conflict 1 of 2 2 conflicts remaining");
    expect(
      toolbar().getByRole("button", { name: "Mark as resolved" }),
    ).toBeDisabled();
  });

  it("names the result textbox and puts each conflict in a labeled group", () => {
    setup();

    expect(textarea()).toHaveAccessibleName("Result");
    const groups = screen.getAllByRole("group", {
      name: /^Conflict \d of 2: unresolved$/,
    });
    expect(groups).toHaveLength(4);
    expect(
      groups.filter((group) => group.hasAttribute("aria-current")),
    ).toHaveLength(2);
  });

  it("accepts a side, moves on to the next conflict and announces it", async () => {
    setup();

    await user.click(toolbar().getByRole("button", { name: "Accept theirs" }));

    expect(result()).toContain(lines("b", "theirs1", "d"));
    expect(result()).toContain("<<<<<<<");
    expect(screen.getByTestId("current")).toHaveTextContent("1");
    expect(screen.getByText("1 conflict remaining")).toBeInTheDocument();
    await vi.waitFor(() =>
      expect(status()).toHaveTextContent(
        "Conflict 1 of 2: accepted theirs. 1 conflict remaining Conflict 2 of 2: unresolved.",
      ),
    );
  });

  it("resolves every conflict from the keyboard and fires a cancelable resolve", async () => {
    const { onResolve } = setup();
    const root = screen.getByRole("group", { name: "Merge conflicts" });

    await fireEvent.keyDown(root, { key: "o", code: "KeyO", altKey: true });
    await fireEvent.keyDown(root, { key: "b", code: "KeyB", altKey: true });
    expect(screen.getByText("All conflicts resolved")).toBeInTheDocument();
    expect(result()).toBe(
      lines("a", "b", "ours1", "d", "e", "ours2", "theirs2", "g"),
    );

    onResolve.mockImplementationOnce((event: Event) => event.preventDefault());
    await fireEvent.keyDown(root, { key: "Enter", ctrlKey: true });
    expect(onResolve).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("resolved")).toHaveTextContent("false");

    await user.click(
      toolbar().getByRole("button", { name: "Mark as resolved" }),
    );
    expect(onResolve).toHaveBeenCalledTimes(2);
    expect(onResolve.mock.calls[1][0].detail).toMatchObject({
      text: result(),
      remaining: 0,
    });
    expect(screen.getByTestId("resolved")).toHaveTextContent("true");
  });

  it("moves between conflicts with F7 and Shift+F7 and wraps", async () => {
    setup();
    const root = screen.getByRole("group", { name: "Merge conflicts" });

    await fireEvent.keyDown(root, { key: "F7" });
    expect(screen.getByTestId("current")).toHaveTextContent("1");
    await fireEvent.keyDown(root, { key: "F7" });
    expect(screen.getByTestId("current")).toHaveTextContent("0");
    await fireEvent.keyDown(root, { key: "F7", shiftKey: true });
    expect(screen.getByTestId("current")).toHaveTextContent("1");
  });

  it("undoes and redoes an accept, restoring the markers", async () => {
    setup();
    const original = result();

    await user.click(toolbar().getByRole("button", { name: "Accept ours" }));
    expect(result()).not.toBe(original);

    await user.click(toolbar().getByRole("button", { name: "Undo" }));
    expect(result()).toBe(original);
    expect(textarea()).toHaveValue(original);
    expect(screen.getByText("2 conflicts remaining")).toBeInTheDocument();

    await user.click(toolbar().getByRole("button", { name: "Redo" }));
    expect(result()).toContain(lines("b", "ours1", "d"));
  });

  it("keeps a conflict in place when lines above it are edited by hand", async () => {
    setup();

    await type(`first\n${textarea().value}`, 6);
    expect(result().startsWith("first\na\nb\n<<<<<<<")).toBe(true);
    expect(screen.getByText("2 conflicts remaining")).toBeInTheDocument();

    await user.click(toolbar().getByRole("button", { name: "Accept theirs" }));
    expect(result().startsWith(lines("first", "a", "b", "theirs1", "d"))).toBe(
      true,
    );
  });

  it("counts a conflict as resolved once its markers are typed away", async () => {
    setup();
    const area = textarea();
    const start = area.value.indexOf("<<<<<<<");
    const end = area.value.indexOf(">>>>>>>") + ">>>>>>>\n".length;

    await type(
      area.value.slice(0, start) + lines("custom") + area.value.slice(end),
      start + 7,
    );

    expect(screen.getByText("1 conflict remaining")).toBeInTheDocument();
    await vi.waitFor(() =>
      expect(status()).toHaveTextContent(
        "Conflict 1 of 2: edited manually. 1 conflict remaining",
      ),
    );
  });

  it("reads one file with conflict markers", () => {
    setup({
      base: "",
      ours: "",
      theirs: "",
      conflicted: lines(
        "keep",
        "<<<<<<< HEAD",
        "x",
        "=======",
        "y",
        ">>>>>>> topic",
      ),
    });

    expect(screen.getByText("1 conflict remaining")).toBeInTheDocument();
    expect(
      toolbar().getByRole("button", { name: "Accept base" }),
    ).toBeDisabled();
    expect(screen.getByText("Ours")).toBeInTheDocument();
  });

  it("writes the result with the line ending of the inputs", () => {
    setup({
      base: "a\r\nb\r\n",
      ours: "a\r\nB\r\n",
      theirs: "a\r\nb\r\n",
    });

    expect(result()).toBe("a\r\nB\r\n");
    expect(screen.getByText("No conflicts")).toBeInTheDocument();
  });

  it("reports changes", async () => {
    const { onChange } = setup();
    expect(onChange).not.toHaveBeenCalled();

    await user.click(toolbar().getByRole("button", { name: "Accept ours" }));
    await tick();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].detail).toMatchObject({ remaining: 1 });
  });
});
