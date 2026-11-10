import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import PropertyInspector from "./PropertyInspector.test.svelte";

type Shape = Record<string, unknown> & { id: string };

const a: Shape = {
  id: "a",
  kind: "rect",
  name: "Card",
  x: 10,
  y: 5,
  on: true,
  flip: false,
  blend: "normal",
  font: "sans",
  align: "start",
  fill: "#ff0000",
  locked: "A",
  radius: 4,
};
const b: Shape = {
  ...a,
  id: "b",
  name: "Banner",
  x: 30,
  on: false,
  blend: "multiply",
  font: "serif",
  align: "end",
  fill: "#0000ff",
  locked: "B",
};
const c: Shape = { ...b, id: "c", kind: "ellipse", name: "Banner" };

async function openStyle() {
  await user.click(screen.getByRole("button", { name: "Style" }));
}

describe("PropertyInspector mixed values", () => {
  it("shows the value the objects share, and Mixed where they differ", () => {
    render(PropertyInspector, { props: { selection: [a, b] } });

    expect(screen.getByRole("spinbutton", { name: "Position Y" })).toHaveValue(
      "5",
    );
    const x = screen.getByRole("spinbutton", { name: "Position X" });
    expect(x).toHaveValue("");
    expect(x).toHaveAttribute("placeholder", "Mixed");
    expect(x).toHaveAttribute("aria-valuetext", "Mixed");
    expect(x).not.toHaveAttribute("aria-valuenow");
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAttribute(
      "placeholder",
      "Mixed",
    );
  });

  it("gives a number its value and unit as the value text", () => {
    render(PropertyInspector, { props: { selection: [a] } });
    expect(
      screen.getByRole("spinbutton", { name: "Position X" }),
    ).toHaveAttribute("aria-valuetext", "10 pixels");
  });

  it("marks each Carbon field mixed in the way it can", async () => {
    render(PropertyInspector, { props: { selection: [a, b] } });
    await openStyle();

    expect(screen.getByRole("checkbox", { name: "On" })).toHaveProperty(
      "indeterminate",
      true,
    );
    expect(screen.getByRole("combobox", { name: "Blend" })).toHaveValue(
      "__mixed__",
    );
    expect(screen.getByRole("combobox", { name: "Font" })).toHaveTextContent(
      "Mixed",
    );
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
    // A switch cannot be mixed, so it says so in its description.
    expect(screen.getByRole("switch", { name: "Flip" })).not.toBeChecked();
  });

  it("describes a mixed toggle, radio group and color as Mixed", async () => {
    render(PropertyInspector, { props: { selection: [a, b] } });
    await openStyle();
    expect(screen.getByRole("radiogroup")).toHaveAccessibleDescription("Mixed");
    expect(
      screen.getByRole("textbox", { name: "Fill" }),
    ).toHaveAccessibleDescription("Mixed");
  });

  it("leaves out a property that not every object has", async () => {
    const { rerender } = render(PropertyInspector, {
      props: { selection: [a] },
    });
    await openStyle();
    expect(
      screen.getByRole("spinbutton", { name: "Radius" }),
    ).toBeInTheDocument();
    await rerender({ selection: [a, c] });
    expect(screen.queryByRole("spinbutton", { name: "Radius" })).toBeNull();
  });

  it("keeps the same field when the selection changes", async () => {
    const { rerender } = render(PropertyInspector, {
      props: { selection: [a] },
    });
    const field = screen.getByRole("spinbutton", { name: "Position Y" });
    field.focus();
    await rerender({ selection: [a, b] });
    expect(screen.getByRole("spinbutton", { name: "Position Y" })).toBe(field);
    expect(field).toHaveFocus();
  });
});

describe("PropertyInspector edits", () => {
  it("writes one typed value to every object, with each object's old value", async () => {
    const onChange = vi.fn();
    const onInput = vi.fn();
    render(PropertyInspector, {
      props: { selection: [a, b], onChange, onInput },
    });

    const x = screen.getByRole("spinbutton", { name: "Position X" });
    await user.clear(x);
    await user.type(x, "50");
    await user.tab();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onInput).toHaveBeenCalledTimes(1);
    const detail = onChange.mock.calls[0][0];
    expect(detail).toMatchObject({ source: "input", property: "x" });
    expect(
      detail.changes.map(
        ({
          targetId,
          property,
          oldValue,
          newValue,
        }: Record<string, unknown>) => [targetId, property, oldValue, newValue],
      ),
    ).toEqual([
      ["a", "x", 10, 50],
      ["b", "x", 30, 50],
    ]);
  });

  it("adds a typed +10 to each object's own value", async () => {
    const onChange = vi.fn();
    render(PropertyInspector, {
      props: { selection: [a, b], onChange },
    });
    const x = screen.getByRole("spinbutton", { name: "Position X" });
    await user.type(x, "+10");
    await user.tab();
    expect(
      onChange.mock.calls[0][0].changes.map(
        (change: { newValue: number }) => change.newValue,
      ),
    ).toEqual([20, 40]);
  });

  it("reports an edit that changes nothing as no change", async () => {
    const onChange = vi.fn();
    render(PropertyInspector, { props: { selection: [a], onChange } });
    const x = screen.getByRole("spinbutton", { name: "Position X" });
    await user.clear(x);
    await user.type(x, "10");
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("steps from the keyboard: Shift moves ten, and one press is one change", async () => {
    const onChange = vi.fn();
    const onInput = vi.fn();
    render(PropertyInspector, {
      props: { selection: [a, b], onChange, onInput },
    });
    const x = screen.getByRole("spinbutton", { name: "Position X" });
    x.focus();
    await user.keyboard("{Shift>}{ArrowUp}{/Shift}");

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(
      onChange.mock.calls[0][0].changes.map(
        (change: { newValue: number }) => change.newValue,
      ),
    ).toEqual([20, 40]);
  });

  it("coalesces a held key into one change", async () => {
    const onChange = vi.fn();
    const onInput = vi.fn();
    render(PropertyInspector, { props: { selection: [a], onChange, onInput } });
    const x = screen.getByRole("spinbutton", { name: "Position X" });
    x.focus();
    await user.keyboard("{ArrowUp>3}");
    expect(onInput.mock.calls.length).toBeGreaterThan(1);
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard("{/ArrowUp}");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].changes[0]).toMatchObject({
      oldValue: 10,
      newValue: 13,
    });
  });

  it("clamps each object to the property limits", async () => {
    const onChange = vi.fn();
    render(PropertyInspector, {
      props: {
        selection: [a, b],
        onChange,
        properties: [{ id: "x", label: "X", type: "number", min: 0, max: 35 }],
      },
    });
    await user.type(screen.getByRole("spinbutton", { name: "X" }), "+10");
    await user.tab();
    expect(
      onChange.mock.calls[0][0].changes.map(
        (change: { newValue: number }) => change.newValue,
      ),
    ).toEqual([20, 35]);
  });

  it("writes a text value on Enter", async () => {
    const onChange = vi.fn();
    render(PropertyInspector, { props: { selection: [a, b], onChange } });
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Hero");
    await user.tab();
    expect(
      onChange.mock.calls[0][0].changes.map(
        (change: { newValue: string }) => change.newValue,
      ),
    ).toEqual(["Hero", "Hero"]);
  });

  it("sets every object when a mixed checkbox is clicked", async () => {
    const onChange = vi.fn();
    render(PropertyInspector, { props: { selection: [a, b], onChange } });
    await openStyle();
    await user.click(screen.getByRole("checkbox", { name: "On" }));
    const detail = onChange.mock.calls[0][0];
    expect(
      detail.changes.map((change: { newValue: boolean }) => change.newValue),
    ).toEqual([true]);
    expect(detail.changes[0].targetId).toBe("b");
  });

  it("does not change a read-only property", async () => {
    const onChange = vi.fn();
    render(PropertyInspector, { props: { selection: [a], onChange } });
    await openStyle();
    const locked = screen.getByRole("textbox", { name: "Locked" });
    expect(locked).toHaveAttribute("readonly");
    await user.type(locked, "z");
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("PropertyInspector reset and search", () => {
  it("marks a modified property and resets it to the default", async () => {
    const onChange = vi.fn();
    render(PropertyInspector, { props: { selection: [a, b], onChange } });
    expect(
      screen.queryByRole("button", { name: "Reset Name" }),
    ).not.toBeInTheDocument();
    // x is mixed and has a default of 0, so it counts as modified.
    await user.click(screen.getByRole("button", { name: "Reset Position" }));
    const detail = onChange.mock.calls[0][0];
    expect(detail.source).toBe("reset");
    expect(
      detail.changes.map((change: { property: string; newValue: number }) => [
        change.property,
        change.newValue,
      ]),
    ).toEqual([
      ["x", 0],
      ["x", 0],
      ["y", 0],
      ["y", 0],
    ]);
  });

  it("filters rows and groups, and names the count", async () => {
    render(PropertyInspector, { props: { selection: [a] } });
    await user.type(screen.getByRole("searchbox"), "posi");
    expect(screen.getByRole("group", { name: "Position" })).toBeVisible();
    expect(screen.queryByRole("textbox", { name: "Name" })).toBeNull();
    expect(screen.getByText("2 properties")).toBeInTheDocument();
    await user.clear(screen.getByRole("searchbox"));
    await user.type(screen.getByRole("searchbox"), "nothing");
    expect(screen.getByText("No properties match.")).toBeInTheDocument();
  });

  it("builds a collapsed group the first time it opens", async () => {
    render(PropertyInspector, { props: { selection: [a] } });
    expect(screen.queryByRole("checkbox", { name: "On" })).toBeNull();
    await openStyle();
    expect(screen.getByRole("checkbox", { name: "On" })).toBeVisible();
    await openStyle();
    expect(
      screen.getByRole("checkbox", { name: "On", hidden: true }),
    ).not.toBeVisible();
    expect(
      screen.getByRole("button", { name: "Style", expanded: false }),
    ).toBeInTheDocument();
  });

  it("says what to do with nothing selected", async () => {
    render(PropertyInspector, { props: { selection: [] } });
    expect(
      screen.getByText("Select an object to see its properties."),
    ).toBeInTheDocument();
    await tick();
    expect(screen.queryByRole("searchbox")).toBeNull();
  });
});
