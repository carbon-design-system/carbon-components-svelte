import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import SessionStorageObject from "./SessionStorageObject.test.svelte";

describe("SessionStorage - Object Values", () => {
  let sessionStorageMock: { [key: string]: string };
  let originalSessionStorage: Storage;

  beforeEach(() => {
    originalSessionStorage = globalThis.sessionStorage;
    sessionStorageMock = {};

    globalThis.sessionStorage = {
      getItem: vi.fn((key) => sessionStorageMock[key] || null),
      setItem: vi.fn((key, value) => {
        sessionStorageMock[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete sessionStorageMock[key];
      }),
      clear: vi.fn(() => {
        sessionStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    };
  });

  afterEach(() => {
    globalThis.sessionStorage = originalSessionStorage;
    sessionStorage.clear();
    vi.restoreAllMocks();
    sessionStorageMock = {};
  });

  it("saves object value as JSON string", () => {
    render(SessionStorageObject);

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      "theme-settings",
      JSON.stringify({ theme: "dark", fontSize: 16 }),
    );
  });

  it("loads existing object value from sessionStorage", async () => {
    const existingSettings = { theme: "light", fontSize: 14 };
    sessionStorageMock["theme-settings"] = JSON.stringify(existingSettings);

    const { component } = render(SessionStorageObject);
    await tick();

    expect(component.value).toEqual(existingSettings);
  });

  // Change detection compares the serialized form, so an in-place mutation
  // signalled via the Svelte `value = value` idiom is persisted. A referential
  // `prevValue !== value` check could not detect this, because `prevValue`
  // aliases `value` (same object reference) after each cycle.
  it("persists an in-place mutation of an object value", async () => {
    const { component } = render(SessionStorageObject);
    await tick();

    vi.mocked(sessionStorage.setItem).mockClear();

    // Mutate in place, then self-assign to trigger Svelte reactivity.
    component.value.theme = "light";
    // biome-ignore lint/correctness/noSelfAssign: the `value = value` idiom is the behavior under test
    component.value = component.value;
    await tick();

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      "theme-settings",
      JSON.stringify({ theme: "light", fontSize: 16 }),
    );
  });

  // The inverse: reassigning to a new object with identical content serializes
  // the same, so no redundant write is issued.
  it("does not write when a new reference has identical content", async () => {
    const { component } = render(SessionStorageObject);
    await tick();

    vi.mocked(sessionStorage.setItem).mockClear();

    component.value = { ...component.value };
    await tick();

    expect(sessionStorage.setItem).not.toHaveBeenCalled();
  });
});
