import { render } from "@testing-library/svelte";
import type LocalStorageComponent from "carbon-components-svelte/LocalStorage/LocalStorage.svelte";
import type SessionStorageComponent from "carbon-components-svelte/SessionStorage/SessionStorage.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { tick } from "svelte";
import { blockStorage, storageCases } from "./helpers";
import StorageHarness from "./Storage.test.svelte";

describe.each(storageCases)("$name", ({ Component, area, defaultKey }) => {
  const store = () => window[area];

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("uses default key if none provided", () => {
    render(Component, { props: { value: "test-value" } });

    expect(store().getItem(defaultKey)).toBe("test-value");
  });

  it("saves primitive value to storage on mount", () => {
    render(StorageHarness, {
      props: { Component, key: "test-key", value: "test-value" },
    });

    expect(store().getItem("test-key")).toBe("test-value");
  });

  it("loads existing primitive value from storage", async () => {
    store().setItem("test-key", "existing-value");

    const { component } = render(StorageHarness, {
      props: { Component, key: "test-key", value: "test-value" },
    });
    await tick();

    expect(component.value).toBe("existing-value");
  });

  it("dispatches save event when setting initial value", () => {
    const onSave = vi.fn();
    render(StorageHarness, {
      props: { Component, key: "test-key", value: "test-value", onSave },
    });

    expect(onSave).toHaveBeenCalled();
  });

  it("dispatches update event and persists when value changes after mount", async () => {
    const onUpdate = vi.fn();
    const { component } = render(StorageHarness, {
      props: { Component, key: "test-key", value: "test-value", onUpdate },
    });

    component.value = "next-value";
    await tick();

    expect(onUpdate).toHaveBeenCalledWith({
      prevValue: "test-value",
      value: "next-value",
    });
    expect(store().getItem("test-key")).toBe("next-value");
  });

  it("hydrates invalid JSON as the raw string on mount", async () => {
    store().setItem("hardening-key", "{invalid-json}");

    const { component } = render(StorageHarness, {
      props: { Component, key: "hardening-key", value: "from-props" },
    });
    await tick();

    expect(component.value).toBe("{invalid-json}");
  });

  it("reads back a stored string that looks like JSON as a string", async () => {
    render(StorageHarness, { props: { Component, key: "k", value: "123" } });
    await tick();

    const { component } = render(StorageHarness, {
      props: { Component, key: "k", value: "initial" },
    });
    await tick();

    expect(component.value).toBe("123");
  });

  describe("object values", () => {
    const settings = { theme: "dark", fontSize: 16 };
    const renderSettings = () =>
      render(StorageHarness, {
        props: { Component, key: "theme-settings", value: { ...settings } },
      });

    it("saves object value as JSON string", () => {
      renderSettings();

      expect(store().getItem("theme-settings")).toBe(JSON.stringify(settings));
    });

    it("loads existing object value from storage", async () => {
      const existingSettings = { theme: "light", fontSize: 14 };
      store().setItem("theme-settings", JSON.stringify(existingSettings));

      const { component } = renderSettings();
      await tick();

      expect(component.value).toEqual(existingSettings);
    });

    // Change detection compares the serialized form, so an in-place mutation
    // signalled via the Svelte `value = value` idiom is persisted. A referential
    // `prevValue !== value` check could not detect this, because `prevValue`
    // aliases `value` (same object reference) after each cycle.
    it("persists an in-place mutation of an object value", async () => {
      const { component } = renderSettings();
      await tick();

      // Mutate in place, then self-assign to trigger Svelte reactivity.
      (component.value as typeof settings).theme = "light";
      // biome-ignore lint/correctness/noSelfAssign: the `value = value` idiom is the behavior under test
      component.value = component.value;
      await tick();

      expect(store().getItem("theme-settings")).toBe(
        JSON.stringify({ theme: "light", fontSize: 16 }),
      );
    });

    // The inverse: reassigning to a new object with identical content serializes
    // the same, so no redundant write is issued.
    it("does not write when a new reference has identical content", async () => {
      const { component } = renderSettings();
      await tick();

      const setItem = vi.spyOn(Storage.prototype, "setItem");

      component.value = { ...(component.value as typeof settings) };
      await tick();

      expect(setItem).not.toHaveBeenCalled();
    });
  });

  // Regression tests for https://github.com/carbon-design-system/carbon-components-svelte/issues/1204
  describe("reactive key", () => {
    it("should update value when key prop changes", async () => {
      store().setItem("key-a", "value-a");
      store().setItem("key-b", "value-b");

      const { component, rerender } = render(StorageHarness, {
        props: { Component, key: "key-a" },
      });
      await tick();
      expect(component.value).toBe("value-a");

      await rerender({ key: "key-b" });

      expect(component.value).toBe("value-b");
    });

    it("should not overwrite new key with old value when key changes", async () => {
      store().setItem("user-1-settings", JSON.stringify({ theme: "dark" }));
      store().setItem("user-2-settings", JSON.stringify({ theme: "light" }));
      const setItem = vi.spyOn(Storage.prototype, "setItem");

      const { component, rerender } = render(StorageHarness, {
        props: { Component, key: "user-1-settings" },
      });
      await tick();
      expect(component.value).toEqual({ theme: "dark" });

      await rerender({ key: "user-2-settings" });

      expect(component.value).toEqual({ theme: "light" });
      expect(store().getItem("user-2-settings")).toBe(
        JSON.stringify({ theme: "light" }),
      );
      expect(setItem).not.toHaveBeenCalledWith(
        "user-2-settings",
        JSON.stringify({ theme: "dark" }),
      );
    });

    it("should persist current value when switching to new key with no stored value", async () => {
      store().setItem("existing-key", "existing-value");

      const { component, rerender } = render(StorageHarness, {
        props: { Component, key: "existing-key" },
      });
      await tick();
      expect(component.value).toBe("existing-value");

      await rerender({ key: "new-key" });

      expect(store().getItem("new-key")).toBe("existing-value");
    });
  });

  describe("clearItem and clearAll", () => {
    const renderProgrammatic = () =>
      render(StorageHarness, {
        props: {
          Component,
          key: "programmatic-key",
          value: "programmatic-value",
        },
      });

    it("clearItem removes the key from storage and resets the bound value", async () => {
      const removeItem = vi.spyOn(Storage.prototype, "removeItem");
      const { component } = renderProgrammatic();
      await tick();
      store().setItem("other-key", "kept");

      component.ref?.clearItem();
      await tick();

      expect(removeItem).toHaveBeenCalledWith("programmatic-key");
      expect(store().getItem("programmatic-key")).toBeNull();
      expect(store().getItem("other-key")).toBe("kept");
      expect(component.value).toBeUndefined();
    });

    it("clearAll empties storage and resets the bound value", async () => {
      const clear = vi.spyOn(Storage.prototype, "clear");
      const { component } = renderProgrammatic();
      await tick();
      store().setItem("other-key", "gone");

      component.ref?.clearAll();
      await tick();

      expect(clear).toHaveBeenCalled();
      expect(store().getItem("programmatic-key")).toBeNull();
      expect(store().getItem("other-key")).toBeNull();
      expect(component.value).toBeUndefined();
    });

    it.each(["clearItem", "clearAll"] as const)(
      "%s resets the bound value",
      async (method) => {
        const onUpdate = vi.fn();
        const { component } = render(StorageHarness, {
          props: { Component, key: "k", value: "on", onUpdate },
        });
        await tick();

        component.ref?.[method]();
        await tick();

        expect(component.value).toBeUndefined();
        expect(store().getItem("k")).toBeNull();
        expect(onUpdate).toHaveBeenCalledWith({
          prevValue: "on",
          value: undefined,
        });
      },
    );

    it("clearItem and clearAll do not throw when storage is blocked", async () => {
      const restore = blockStorage(area);

      try {
        const { component } = render(StorageHarness, { props: { Component } });
        await tick();

        expect(() => component.ref?.clearItem()).not.toThrow();
        expect(() => component.ref?.clearAll()).not.toThrow();
      } finally {
        restore();
      }
    });
  });
});

// Types can't be parametrized by describe.each, so each component keeps its own block.
describe("LocalStorage Generics", () => {
  it("should support custom types with generics", () => {
    type CustomValue = "option1" | "option2" | "option3";

    type ComponentType = LocalStorageComponent<CustomValue>;
    type Props = ComponentProps<ComponentType>;
    type Events = ComponentEvents<ComponentType>;

    expectTypeOf<Props["value"]>().toEqualTypeOf<CustomValue | undefined>();

    type UpdateEvent = Events["update"];
    type UpdateEventDetail =
      UpdateEvent extends CustomEvent<infer T> ? T : never;
    expectTypeOf<UpdateEventDetail>().toEqualTypeOf<{
      prevValue: CustomValue;
      value: CustomValue;
    }>();
  });

  it("should default to any type when generic is not specified", () => {
    type ComponentType = LocalStorageComponent;
    type Props = ComponentProps<ComponentType>;
    type Events = ComponentEvents<ComponentType>;

    // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
    expectTypeOf<Props["value"]>().toEqualTypeOf<any>();

    type UpdateEvent = Events["update"];
    type UpdateEventDetail =
      UpdateEvent extends CustomEvent<infer T> ? T : never;
    expectTypeOf<UpdateEventDetail>().toEqualTypeOf<{
      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      prevValue: any;
      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      value: any;
    }>();
  });
});

describe("SessionStorage Generics", () => {
  it("should support custom types with generics", () => {
    type CustomValue = "option1" | "option2" | "option3";

    type ComponentType = SessionStorageComponent<CustomValue>;
    type Props = ComponentProps<ComponentType>;
    type Events = ComponentEvents<ComponentType>;

    expectTypeOf<Props["value"]>().toEqualTypeOf<CustomValue | undefined>();

    type UpdateEvent = Events["update"];
    type UpdateEventDetail =
      UpdateEvent extends CustomEvent<infer T> ? T : never;
    expectTypeOf<UpdateEventDetail>().toEqualTypeOf<{
      prevValue: CustomValue;
      value: CustomValue;
    }>();
  });

  it("should default to any type when generic is not specified", () => {
    type ComponentType = SessionStorageComponent;
    type Props = ComponentProps<ComponentType>;
    type Events = ComponentEvents<ComponentType>;

    // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
    expectTypeOf<Props["value"]>().toEqualTypeOf<any>();

    type UpdateEvent = Events["update"];
    type UpdateEventDetail =
      UpdateEvent extends CustomEvent<infer T> ? T : never;
    expectTypeOf<UpdateEventDetail>().toEqualTypeOf<{
      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      prevValue: any;
      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      value: any;
    }>();
  });
});
