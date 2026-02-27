import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { setupSessionStorageEventMock } from "../setup-tests";
import SessionStorageCrossTab from "./SessionStorageCrossTab.test.svelte";

describe("SessionStorage cross-tab sync", () => {
  const { dispatchStorageEvent } = setupSessionStorageEventMock();

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

  it("ignores storage events with null newValue", async () => {
    const { component } = render(SessionStorageCrossTab, {
      props: { key: "test-key", value: "initial" },
    });
    await tick();

    dispatchStorageEvent("test-key", null);
    await tick();

    expect(component.value).toBe("initial");
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
