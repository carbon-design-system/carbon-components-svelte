// @vitest-environment node
import {
  createGesture,
  editableTargets,
  resolveProperties,
  resolveProperty,
} from "../../src/PropertyInspector/resolve-mixed.js";

type Shape = {
  id: string;
  [key: string]: unknown;
};

const getValue = (target: Shape, id: string) => target[id];

const shapes: Shape[] = [
  { id: "a", x: 10, fill: "#f00", tags: ["x"], locked: false },
  { id: "b", x: 10, fill: "#00f", tags: ["x"], locked: true },
  { id: "c", x: 10, fill: "#f00", tags: ["x"], locked: false },
];

describe("resolveProperty", () => {
  it("returns the shared value when every object agrees", () => {
    const state = resolveProperty(shapes, { id: "x" }, { getValue });
    expect(state).toMatchObject({
      applicable: true,
      count: 3,
      mixed: false,
      value: 10,
    });
  });

  it("is mixed, with no value, when two objects differ", () => {
    const state = resolveProperty(shapes, { id: "fill" }, { getValue });
    expect(state.mixed).toBe(true);
    expect(state.value).toBeUndefined();
  });

  it("compares arrays by content", () => {
    const state = resolveProperty(shapes, { id: "tags" }, { getValue });
    expect(state.mixed).toBe(false);
    expect(state.value).toEqual(["x"]);
  });

  it("treats NaN as equal to NaN", () => {
    const state = resolveProperty(
      [
        { id: "a", n: Number.NaN },
        { id: "b", n: Number.NaN },
      ],
      { id: "n" },
      { getValue },
    );
    expect(state.mixed).toBe(false);
  });

  it("uses the equals option", () => {
    const state = resolveProperty(
      [
        { id: "a", c: "#FF0000" },
        { id: "b", c: "#ff0000" },
      ],
      { id: "c" },
      {
        getValue,
        equals: (a, b) => String(a).toLowerCase() === String(b).toLowerCase(),
      },
    );
    expect(state.mixed).toBe(false);
  });

  it("stops reading at the first value that differs", () => {
    const read = vi.fn(getValue);
    const many = Array.from({ length: 100 }, (_, index) => ({
      id: String(index),
      v: index === 1 ? 2 : 1,
    }));
    resolveProperty(many, { id: "v" }, { getValue: read });
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("shows a property only when every object has it, unless scope is any", () => {
    const mixedKinds = [
      { id: "r", kind: "rect", radius: 4 },
      { id: "e", kind: "ellipse" },
    ];
    const property = {
      id: "radius",
      appliesTo: (shape: Shape) => shape.kind === "rect",
    };
    const all = resolveProperty(mixedKinds, property, { getValue });
    expect(all.applicable).toBe(false);
    const any = resolveProperty(mixedKinds, property, {
      getValue,
      scope: "any",
    });
    expect(any).toMatchObject({ applicable: true, count: 1, value: 4 });
  });

  it("is not applicable for an empty selection", () => {
    expect(resolveProperty([], { id: "x" }, { getValue }).applicable).toBe(
      false,
    );
  });
});

describe("modified", () => {
  it("compares the shared value with the property default", () => {
    expect(
      resolveProperty(shapes, { id: "x", default: 10 }, { getValue }).modified,
    ).toBe(false);
    expect(
      resolveProperty(shapes, { id: "x", default: 0 }, { getValue }).modified,
    ).toBe(true);
  });

  it("counts a mixed property as modified without reading a default", () => {
    expect(
      resolveProperty(shapes, { id: "fill", default: "#f00" }, { getValue })
        .modified,
    ).toBe(true);
  });

  it("is never modified when there is no default to reset to", () => {
    expect(resolveProperty(shapes, { id: "fill" }, { getValue }).modified).toBe(
      false,
    );
  });

  it("lets getDefault give each object its own default", () => {
    const getDefault = (target: Shape) => (target.id === "b" ? 99 : 10);
    const state = resolveProperty(
      shapes,
      { id: "x" },
      { getValue, getDefault },
    );
    expect(state.modified).toBe(true);
    expect(state.mixed).toBe(false);
  });
});

describe("read-only", () => {
  const property = {
    id: "x",
    readOnly: (target: Shape) => target.locked === true,
  };

  it("is read-only only when every object is", () => {
    const state = resolveProperty(shapes, property, { getValue });
    expect(state).toMatchObject({ readOnly: false, readOnlyCount: 1 });
    expect(resolveProperty([shapes[1]], property, { getValue }).readOnly).toBe(
      true,
    );
  });

  it("leaves read-only objects out of the edit", () => {
    expect(editableTargets(shapes, property).map((s) => s.id)).toEqual([
      "a",
      "c",
    ]);
  });
});

describe("resolveProperties", () => {
  it("reuses a state that did not change", () => {
    const properties = [{ id: "x" }, { id: "fill" }];
    const first = resolveProperties(shapes, properties, { getValue });
    const second = resolveProperties(
      [...shapes],
      properties,
      { getValue },
      first,
    );
    expect(second.get("x")).toBe(first.get("x"));
    expect(second.get("fill")).toBe(first.get("fill"));
  });

  it("returns a new state when the value changed", () => {
    const properties = [{ id: "x" }];
    const first = resolveProperties(shapes, properties, { getValue });
    const second = resolveProperties(
      [{ id: "a", x: 11 }],
      properties,
      { getValue },
      first,
    );
    expect(second.get("x")).not.toBe(first.get("x"));
    expect(second.get("x")?.value).toBe(11);
  });
});

describe("createGesture", () => {
  const entries = shapes.map((shape) => ({
    target: shape,
    targetId: shape.id,
    property: "x",
    from: shape.x,
  }));

  it("reports old and new values from where the gesture began", () => {
    const gesture = createGesture(entries);
    gesture.update((entry) => (entry.from as number) + 1);
    const update = gesture.update((entry) => (entry.from as number) + 5);
    expect(update).toHaveLength(3);
    expect(update?.[0]).toMatchObject({
      targetId: "a",
      property: "x",
      oldValue: 10,
      newValue: 15,
    });
    expect(gesture.changes()).toHaveLength(3);
  });

  it("returns every entry when one comes back to where it began, and none to commit", () => {
    const gesture = createGesture(entries);
    gesture.update((entry) => (entry.from as number) + 5);
    const back = gesture.update((entry) => entry.from);
    expect(back?.map((change) => change.newValue)).toEqual([10, 10, 10]);
    expect(gesture.changes()).toEqual([]);
  });

  it("returns null when nothing moved since the last update", () => {
    const gesture = createGesture(entries);
    expect(gesture.update((entry) => entry.from)).not.toBeNull();
    expect(gesture.update((entry) => entry.from)).toBeNull();
    expect(
      gesture.update((entry) => (entry.from as number) + 1),
    ).not.toBeNull();
    expect(gesture.update((entry) => (entry.from as number) + 1)).toBeNull();
  });
});
