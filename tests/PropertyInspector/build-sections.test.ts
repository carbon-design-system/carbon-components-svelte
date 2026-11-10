// @vitest-environment node
import { buildSections } from "../../src/PropertyInspector/build-sections.js";

const properties = [
  {
    id: "x",
    label: "X",
    row: "position",
    rowLabel: "Position",
    group: "layout",
  },
  { id: "y", label: "Y", row: "position", group: "layout" },
  { id: "width", label: "Width", group: "layout", keywords: ["size"] },
  { id: "fill", label: "Fill", group: "appearance" },
  { id: "radius", label: "Radius", group: "appearance" },
  { id: "name", label: "Name" },
];

const states = new Map(
  properties.map((property) => [
    property.id,
    { applicable: property.id !== "radius" },
  ]),
);

describe("buildSections", () => {
  it("groups by first appearance and joins a shared row", () => {
    const sections = buildSections(properties, states);
    expect(sections.map((section) => section.id)).toEqual([
      "layout",
      "appearance",
      "",
    ]);
    const [layout] = sections;
    expect(layout.rows.map((row) => row.label)).toEqual(["Position", "Width"]);
    expect(layout.rows[0].properties.map((p) => p.id)).toEqual(["x", "y"]);
    expect(layout.count).toBe(3);
  });

  it("leaves out properties that do not apply", () => {
    const appearance = buildSections(properties, states).find(
      (section) => section.id === "appearance",
    );
    expect(appearance?.rows.map((row) => row.id)).toEqual(["fill"]);
  });

  it("orders and names groups from the groups option", () => {
    const sections = buildSections(properties, states, {
      groups: [{ id: "appearance", label: "Appearance" }, "layout"],
    });
    expect(sections.map((section) => section.label)).toEqual([
      "Appearance",
      "layout",
      "",
    ]);
  });

  it("filters by every word, across label, keywords and group", () => {
    const find = (query: string) =>
      buildSections(properties, states, { query }).flatMap((section) =>
        section.rows.map((row) => row.id),
      );
    expect(find("wid")).toEqual(["width"]);
    expect(find("size")).toEqual(["width"]);
    expect(find("POSITION")).toEqual(["position"]);
    expect(find("appearance fill")).toEqual(["fill"]);
    expect(find("nothing")).toEqual([]);
  });
});
