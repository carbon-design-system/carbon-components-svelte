import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { setupSessionStorageEventMock } from "../utils/storage-mocks";
import SessionStorageCrossTab from "./SessionStorageCrossTab.test.svelte";

describe("SessionStorage cross-tab sync", () => {
  const { dispatchStorageEvent, setMockItem } = setupSessionStorageEventMock();

  it("does not dispatch update on mount when hydrating from existing storage", async () => {
    setMockItem("hydrate-key", JSON.stringify("persisted-value"));

    const onUpdate = vi.fn();
    const { component } = render(SessionStorageCrossTab, {
      props: { key: "hydrate-key", value: "initial", onUpdate },
    });
    await tick();

    expect(component.value).toBe("persisted-value");
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("registers a storage event listener on mount", async () => {
    render(SessionStorageCrossTab);
    await tick();

    expect(window.addEventListener).toHaveBeenCalledWith(
      "storage",
      expect.any(Function),
    );
  });

  it("updates value when storage event fires with matching key", async () => {
    const { component } = render(SessionStorageCrossTab, {
      props: { key: "test-key", value: "initial" },
    });
    await tick();

    dispatchStorageEvent("test-key", "updated-from-another-tab");
    await tick();

    expect(component.value).toBe("updated-from-another-tab");
  });

  it("parses JSON values from storage events", async () => {
    const { component } = render(SessionStorageCrossTab, {
      props: { key: "json-key", value: "initial" },
    });
    await tick();

    dispatchStorageEvent("json-key", JSON.stringify({ theme: "dark" }));
    await tick();

    expect(component.value).toEqual({ theme: "dark" });
  });

  it("ignores storage events for different keys", async () => {
    const { component } = render(SessionStorageCrossTab, {
      props: { key: "my-key", value: "initial" },
    });
    await tick();

    dispatchStorageEvent("other-key", "some-value");
    await tick();

    expect(component.value).toBe("initial");
  });

  it("resets value when another tab removes the key", async () => {
    const { component } = render(SessionStorageCrossTab, {
      props: { key: "test-key", value: "initial" },
    });
    await tick();

    // Another context calls sessionStorage.removeItem("test-key"),
    // which fires a storage event with newValue === null.
    dispatchStorageEvent("test-key", null);
    await tick();

    // The in-memory value should not silently retain the stale data;
    // otherwise the next local mutation re-persists it and defeats
    // the removal.
    expect(component.value).toBeUndefined();
  });

  it("dispatches update with prevValue when another tab removes the key", async () => {
    const handleUpdate = vi.fn();
    render(SessionStorageCrossTab, {
      props: { key: "test-key", value: "initial", onUpdate: handleUpdate },
    });
    await tick();

    dispatchStorageEvent("test-key", null);
    await tick();

    expect(handleUpdate).toHaveBeenCalledWith({
      prevValue: "initial",
      value: undefined,
    });
  });

  it("does not dispatch update when key changes to an existing entry", async () => {
    setMockItem("key-b", JSON.stringify("b-value"));

    const onUpdate = vi.fn();
    const { component } = render(SessionStorageCrossTab, {
      props: { key: "key-a", value: "a-value", onUpdate },
    });
    await tick();
    onUpdate.mockClear();

    component.key = "key-b";
    await tick();

    expect(component.value).toBe("b-value");
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("handles invalid JSON gracefully by using raw string", async () => {
    const { component } = render(SessionStorageCrossTab, {
      props: { key: "invalid-json-key", value: "initial" },
    });
    await tick();

    dispatchStorageEvent("invalid-json-key", "{invalid-json}");
    await tick();

    expect(component.value).toBe("{invalid-json}");
  });
});
