import { get, writable } from "svelte/store";
import { createTabsRegistration } from "../../src/utils/tabs-registration.js";

function setup() {
  const tabs = writable<
    ReadonlyArray<{ id: string; index: number; label?: string }>
  >([]);
  const content = writable<ReadonlyArray<{ id: string; index: number }>>([]);
  const onDomSyncNeeded = vi.fn();
  const registration = createTabsRegistration<
    { id: string; label?: string },
    { id: string }
  >({
    tabs,
    content,
    onDomSyncNeeded,
  });
  return { tabs, content, onDomSyncNeeded, ...registration };
}

describe("createTabsRegistration", () => {
  test("adds a tab and assigns it a sequential index", async () => {
    const { add, tabs, onDomSyncNeeded } = setup();
    add({ id: "a" });
    add({ id: "b" });
    await Promise.resolve();
    expect(get(tabs)).toEqual([
      { id: "a", index: 0 },
      { id: "b", index: 1 },
    ]);
    expect(onDomSyncNeeded).toHaveBeenCalled();
  });

  test("re-registering the same id patches it in place, no DOM sync", async () => {
    const { add, tabs, onDomSyncNeeded } = setup();
    add({ id: "a", label: "First" });
    await Promise.resolve();
    onDomSyncNeeded.mockClear();

    add({ id: "a", label: "Updated" });
    await Promise.resolve();
    expect(get(tabs)).toEqual([{ id: "a", label: "Updated", index: 0 }]);
    expect(onDomSyncNeeded).not.toHaveBeenCalled();
  });

  test("removes a tab by id", async () => {
    const { add, remove, tabs } = setup();
    add({ id: "a" });
    add({ id: "b" });
    await Promise.resolve();

    remove("a");
    await Promise.resolve();
    expect(get(tabs)).toEqual([{ id: "b", index: 1 }]);
  });

  test("adds and removes content panels independently of tabs", async () => {
    const { addContent, removeContent, content } = setup();
    addContent({ id: "panel-a" });
    addContent({ id: "panel-b" });
    await Promise.resolve();
    expect(get(content)).toEqual([
      { id: "panel-a", index: 0 },
      { id: "panel-b", index: 1 },
    ]);

    removeContent("panel-a");
    await Promise.resolve();
    expect(get(content)).toEqual([{ id: "panel-b", index: 1 }]);
  });

  test("batches synchronous registrations into a single flush", async () => {
    const { add, tabs } = setup();
    const seen: number[] = [];
    tabs.subscribe((current) => seen.push(current.length));

    add({ id: "a" });
    add({ id: "b" });
    add({ id: "c" });
    expect(seen).toEqual([0]);

    await Promise.resolve();
    expect(seen).toEqual([0, 3]);
  });
});
