import { get } from "svelte/store";
import {
  activeShortcutGroups,
  createShortcutScope,
} from "../../src/ShortcutProvider/shortcut-registry.js";

// Returns the element around the provider, which a modal hides.
function mount(scope: ReturnType<typeof createShortcutScope>) {
  const host = document.createElement("div");
  const element = document.createElement("div");
  host.append(element);
  document.body.append(host);
  scope.element = element;
  return host;
}

const spec = (keys: string, label: string) => ({
  keys,
  label,
  onTrigger: () => {},
});

describe("shortcut registry", () => {
  it("collects every scope's entries into one store, once per microtask", async () => {
    const page = createShortcutScope({ id: "page" });
    const panel = createShortcutScope({
      id: "panel",
      name: "Edit profile",
      parent: page,
    });
    const seen: number[] = [];
    const stop = page.root.entries.subscribe((list) => seen.push(list.length));

    page.register(spec("mod+k", "Open command palette"));
    page.register(spec("mod+s", "Save draft"));
    const save = panel.register(spec("mod+s", "Save profile"));
    expect(get(page.root.entries)).toHaveLength(0);

    await Promise.resolve();
    expect(seen).toEqual([0, 3]);
    expect(
      get(page.root.entries).map((e) => [e.scope.name, e.keys, e.label]),
    ).toEqual([
      [undefined, "mod+k", "Open command palette"],
      [undefined, "mod+s", "Save draft"],
      ["Edit profile", "mod+s", "Save profile"],
    ]);

    save.destroy();
    await Promise.resolve();
    expect(seen).toEqual([0, 3, 2]);
    stop();
  });

  it("groups the entries of shown scopes, innermost first, minus shadowed keys", async () => {
    const page = createShortcutScope({ id: "page" });
    const panel = createShortcutScope({
      id: "panel",
      name: "Edit profile",
      parent: page,
    });
    mount(page);
    const panelHost = mount(panel);

    page.register(spec("mod+k", "Open command palette"));
    page.register(spec("mod+s", "Save draft"));
    panel.register(spec("mod+s", "Save profile"));
    await Promise.resolve();

    const groups = () =>
      activeShortcutGroups(page.root, get(page.root.entries)).map((group) => [
        group.scope,
        group.entries.map((entry) => entry.label),
      ]);

    expect(groups()).toEqual([
      ["Edit profile", ["Save profile"]],
      [undefined, ["Open command palette"]],
    ]);

    panelHost.hidden = true;
    expect(groups()).toEqual([
      [undefined, ["Open command palette", "Save draft"]],
    ]);
  });
});
