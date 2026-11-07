import { kbdKeys } from "carbon-components-svelte/Kbd/kbd-keys.js";

const translate = (id: string) =>
  ({
    shift: "Shift",
    command: "Command",
    option: "Option",
    control: "Control",
    return: "Return",
    tab: "Tab",
    arrowUp: "Up Arrow",
    delete: "Delete",
    forwardDelete: "Forward Delete",
    del: "Del",
    forwardDel: "Fwd Del",
  })[id] ?? id;

describe("kbdKeys", () => {
  it("draws Apple modifiers as icons and names them", () => {
    expect(kbdKeys("ctrl+alt+shift+mod+enter", true, translate)).toEqual([
      { label: "", name: "Control", icon: "control" },
      { label: "", name: "Option", icon: "option" },
      { label: "", name: "Shift", icon: "shift" },
      { label: "", name: "Command", icon: "command" },
      { label: "", name: "Return", icon: "return" },
    ]);
  });

  it("draws arrows as icons on every platform", () => {
    expect(kbdKeys("arrowup", false, translate)).toEqual([
      { label: "", name: "Up Arrow", icon: "arrowUp" },
    ]);
    expect(kbdKeys("arrowup", true, translate)[0].icon).toBe("arrowUp");
  });

  it("shortens the delete keys on Apple platforms and reads full names", () => {
    expect(kbdKeys("backspace", true, translate)).toEqual([
      { label: "Del", name: "Delete" },
    ]);
    expect(kbdKeys("delete", true, translate)).toEqual([
      { label: "Fwd Del", name: "Forward Delete" },
    ]);
    expect(kbdKeys("delete", false, translate)[0].label).toBe("Delete");
  });

  it("keeps words elsewhere", () => {
    expect(
      kbdKeys("mod+shift+tab", false, translate).map((key) => key.icon),
    ).toEqual([undefined, undefined, undefined]);
  });
});
