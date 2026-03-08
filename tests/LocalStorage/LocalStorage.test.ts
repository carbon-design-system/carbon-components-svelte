import { render } from "@testing-library/svelte";
import type LocalStorageComponent from "carbon-components-svelte/LocalStorage/LocalStorage.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { setupLocalStorageMock } from "../setup-tests";
import LocalStorage from "./LocalStorage.test.svelte";

describe("LocalStorage", () => {
  const { setMockItem } = setupLocalStorageMock();

  it("saves primitive value to localStorage on mount", () => {
    render(LocalStorage);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "local-storage-key",
      "test-value",
    );
  });

  it("saves object value as JSON string", () => {
    render(LocalStorage);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "theme-settings",
      JSON.stringify({ theme: "dark", fontSize: 16 }),
    );
  });

  it("loads existing primitive value from localStorage", () => {
    setMockItem("local-storage-key", "existing-value");

    render(LocalStorage);
    expect(localStorage.getItem).toHaveBeenCalledWith("local-storage-key");
  });

  it("loads existing object value from localStorage", () => {
    // Set up existing value
    const existingSettings = { theme: "light", fontSize: 14 };
    setMockItem("theme-settings", JSON.stringify(existingSettings));

    render(LocalStorage);
    expect(localStorage.getItem).toHaveBeenCalledWith("theme-settings");
  });

  it("clears specific item from localStorage", () => {
    const { component } = render(LocalStorage);
    const storage = component.storage;

    if (storage) {
      storage.clearItem();
      expect(localStorage.removeItem).toHaveBeenCalledWith("programmatic-key");
    }
  });

  it("clears all items from localStorage", () => {
    const { component } = render(LocalStorage);
    const storage = component.storage;

    if (storage) {
      storage.clearAll();
      expect(localStorage.clear).toHaveBeenCalled();
    }
  });

  it("handles JSON parse errors gracefully", () => {
    // Set up invalid JSON
    setMockItem("local-storage-key", "{invalid-json}");

    render(LocalStorage);
    expect(localStorage.getItem).toHaveBeenCalledWith("local-storage-key");
  });

  it("uses default key if none provided", () => {
    render(LocalStorage);

    expect(localStorage.getItem).toHaveBeenCalledWith(
      expect.stringContaining("local-storage-key"),
    );
  });

  describe("Generics", () => {
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

    it("should provide type-safe access to custom types in event handlers", () => {
      type Status = "pending" | "approved" | "rejected";

      const handleUpdate = (detail: { prevValue: Status; value: Status }) => {
        expectTypeOf(detail.value).toEqualTypeOf<Status>();
        if (detail.value === "pending") {
          expectTypeOf(detail.value).toEqualTypeOf<"pending">();
        }
      };

      expectTypeOf(handleUpdate).parameter(0).toEqualTypeOf<{
        prevValue: Status;
        value: Status;
      }>();

      type ComponentType = LocalStorageComponent<Status>;
      type Events = ComponentEvents<ComponentType>;
      type UpdateEvent = Events["update"];
      type UpdateEventDetail =
        UpdateEvent extends CustomEvent<infer T> ? T : never;

      expectTypeOf<UpdateEventDetail>().toEqualTypeOf<
        Parameters<typeof handleUpdate>[0]
      >();
    });

    it("should work with object types", () => {
      type ThemeSettings = { theme: "light" | "dark"; fontSize: number };

      type ComponentType = LocalStorageComponent<ThemeSettings>;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<Props["value"]>().toEqualTypeOf<ThemeSettings | undefined>();

      type UpdateEvent = Events["update"];
      type UpdateEventDetail =
        UpdateEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<UpdateEventDetail>().toEqualTypeOf<{
        prevValue: ThemeSettings;
        value: ThemeSettings;
      }>();
    });

    it("should work with 'as const' for type inference", () => {
      const themeOptions = ["light", "dark", "auto"] as const;
      type InferredType = (typeof themeOptions)[number];

      expectTypeOf<typeof themeOptions>().toEqualTypeOf<
        readonly ["light", "dark", "auto"]
      >();
      expectTypeOf<InferredType>().toEqualTypeOf<"light" | "dark" | "auto">();

      type ComponentType = LocalStorageComponent<InferredType>;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<Props["value"]>().toEqualTypeOf<InferredType | undefined>();

      type UpdateEvent = Events["update"];
      type UpdateEventDetail =
        UpdateEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<UpdateEventDetail>().toEqualTypeOf<{
        prevValue: InferredType;
        value: InferredType;
      }>();
    });
  });
});
