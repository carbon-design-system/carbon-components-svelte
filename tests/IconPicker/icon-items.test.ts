// @vitest-environment node
import { iconLabel, toIconItems } from "../../src/IconPicker/icon-items.js";

describe("iconLabel", () => {
  it.each([
    ["Add", "Add"],
    ["AddAlt", "Add alt"],
    ["UIShell", "UI shell"],
    ["ArrowsHorizontal", "Arrows horizontal"],
    ["Number_32", "Number 32"],
    ["Rotate180", "Rotate 180"],
    ["CSV", "CSV"],
  ])("%s becomes %s", (name, label) => {
    expect(iconLabel(name)).toBe(label);
  });
});

describe("toIconItems", () => {
  class ClassIcon {}
  function FunctionIcon() {}
  const loader = () => Promise.resolve({ default: FunctionIcon });

  it("names an item by its key or by the file in a path", () => {
    const items = toIconItems({
      "../node_modules/carbon-icons-svelte/lib/AddAlt.svelte": loader,
      Edit: FunctionIcon,
    });
    expect(items.map((item) => item.id)).toEqual(["AddAlt", "Edit"]);
    expect(items[0].label).toBe("Add alt");
  });

  it("keeps an imported icon, a module's default and a loader apart", () => {
    const [component, klass, module, lazy] = toIconItems({
      A: FunctionIcon,
      B: ClassIcon,
      C: { default: FunctionIcon },
      D: loader,
    });
    expect(component.icon).toBe(FunctionIcon);
    expect(klass.icon).toBe(ClassIcon);
    expect(module.icon).toBe(FunctionIcon);
    expect(lazy.icon).toBeUndefined();
    expect(lazy.load).toBe(loader);
  });

  it("lets the written name find an icon, and sorts into categories", () => {
    const [item, plain] = toIconItems(
      { AddAlt: loader, Add: loader },
      { category: (id) => id[0] },
    );
    expect(item.keywords).toEqual(["AddAlt"]);
    expect(plain.keywords).toBeUndefined();
    expect(item.category).toBe("A");
  });
});
