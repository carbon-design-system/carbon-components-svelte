import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { setupSessionStorageEventMock } from "../utils/storage-mocks";
import SessionStorageSync from "./SessionStorageSync.test.svelte";

describe("SessionStorage sync opt-out", () => {
  const { dispatchStorageEvent, getMockItem } = setupSessionStorageEventMock();

  it("does not register a storage listener when sync is off", async () => {
    render(SessionStorageSync, { props: { sync: "off" } });
    await tick();

    expect(window.addEventListener).not.toHaveBeenCalledWith(
      "storage",
      expect.any(Function),
    );
  });

  it("ignores external storage events when sync is off", async () => {
    const onUpdate = vi.fn();
    const { component } = render(SessionStorageSync, {
      props: { key: "k", value: "initial", sync: "off", onUpdate },
    });
    await tick();

    dispatchStorageEvent("k", "from-an-iframe");
    await tick();

    expect(component.value).toBe("initial");
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("still persists local value changes when sync is off", async () => {
    const { component } = render(SessionStorageSync, {
      props: { key: "k", value: "initial", sync: "off" },
    });
    await tick();

    component.value = "updated-locally";
    await tick();

    expect(getMockItem("k")).toBe("updated-locally");
  });

  it("starts syncing when sync flips from off to on", async () => {
    const { component } = render(SessionStorageSync, {
      props: { key: "k", value: "initial", sync: "off" },
    });
    await tick();

    component.sync = "on";
    await tick();

    dispatchStorageEvent("k", "now-synced");
    await tick();

    expect(component.value).toBe("now-synced");
  });
});
