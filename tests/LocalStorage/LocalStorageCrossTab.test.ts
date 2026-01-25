import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { setupStorageEventMock } from "../setup-tests";
import LocalStorageCrossTab from "./LocalStorageCrossTab.test.svelte";

describe("LocalStorage cross-tab sync", () => {
  const { dispatchStorageEvent } = setupStorageEventMock();

  it("registers a storage event listener on mount", async () => {
    render(LocalStorageCrossTab);
    await tick();

    expect(window.addEventListener).toHaveBeenCalledWith(
      "storage",
      expect.any(Function),
    );
  });

  it("updates value when storage event fires with matching key", async () => {
    const { component } = render(LocalStorageCrossTab, {
      props: { key: "test-key", value: "initial" },
    });
    await tick();

    // Simulate a storage event from another tab
    dispatchStorageEvent("test-key", "updated-from-another-tab");
    await tick();

    expect(component.value).toBe("updated-from-another-tab");
  });

  it("parses JSON values from storage events", async () => {
    const { component } = render(LocalStorageCrossTab, {
      props: { key: "json-key", value: "initial" },
    });
    await tick();

    // Simulate a storage event with JSON value
    dispatchStorageEvent("json-key", JSON.stringify({ theme: "dark" }));
    await tick();

    expect(component.value).toEqual({ theme: "dark" });
  });

  it("ignores storage events for different keys", async () => {
    const { component } = render(LocalStorageCrossTab, {
      props: { key: "my-key", value: "initial" },
    });
    await tick();

    // Simulate a storage event for a different key
    dispatchStorageEvent("other-key", "some-value");
    await tick();

    expect(component.value).toBe("initial");
  });

  it("ignores storage events with null newValue", async () => {
    const { component } = render(LocalStorageCrossTab, {
      props: { key: "test-key", value: "initial" },
    });
    await tick();

    // Simulate a storage event with null (key was removed)
    dispatchStorageEvent("test-key", null);
    await tick();

    expect(component.value).toBe("initial");
  });

  it("handles invalid JSON gracefully by using raw string", async () => {
    const { component } = render(LocalStorageCrossTab, {
      props: { key: "invalid-json-key", value: "initial" },
    });
    await tick();

    // Simulate a storage event with invalid JSON
    dispatchStorageEvent("invalid-json-key", "{invalid-json}");
    await tick();

    expect(component.value).toBe("{invalid-json}");
  });
});
