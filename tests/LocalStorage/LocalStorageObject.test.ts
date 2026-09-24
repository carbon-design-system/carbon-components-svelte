import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { setupLocalStorageMock } from "../utils/storage-mocks";
import LocalStorageObject from "./LocalStorageObject.test.svelte";

describe("LocalStorage - Object Values", () => {
  const { setMockItem } = setupLocalStorageMock();

  it("saves object value as JSON string", () => {
    render(LocalStorageObject);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "theme-settings",
      JSON.stringify({ theme: "dark", fontSize: 16 }),
    );
  });

  it("loads existing object value from localStorage", async () => {
    const existingSettings = { theme: "light", fontSize: 14 };
    setMockItem("theme-settings", JSON.stringify(existingSettings));

    const { component } = render(LocalStorageObject);
    await tick();

    expect(component.value).toEqual(existingSettings);
  });

  // Change detection compares the serialized form, so an in-place mutation
  // signalled via the Svelte `value = value` idiom is persisted. A referential
  // `prevValue !== value` check could not detect this, because `prevValue`
  // aliases `value` (same object reference) after each cycle.
  it("persists an in-place mutation of an object value", async () => {
    const { component } = render(LocalStorageObject);
    await tick();

    vi.mocked(localStorage.setItem).mockClear();

    // Mutate in place, then self-assign to trigger Svelte reactivity.
    component.value.theme = "light";
    // biome-ignore lint/correctness/noSelfAssign: the `value = value` idiom is the behavior under test
    component.value = component.value;
    await tick();

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "theme-settings",
      JSON.stringify({ theme: "light", fontSize: 16 }),
    );
  });

  // The inverse: reassigning to a new object with identical content serializes
  // the same, so no redundant write is issued.
  it("does not write when a new reference has identical content", async () => {
    const { component } = render(LocalStorageObject);
    await tick();

    vi.mocked(localStorage.setItem).mockClear();

    component.value = { ...component.value };
    await tick();

    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
});
