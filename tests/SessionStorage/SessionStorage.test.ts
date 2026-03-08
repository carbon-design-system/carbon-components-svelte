import { render } from "@testing-library/svelte";
import type SessionStorageComponent from "carbon-components-svelte/SessionStorage/SessionStorage.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { setupSessionStorageMock } from "../setup-tests";
import SessionStorage from "./SessionStorage.test.svelte";

describe("SessionStorage", () => {
  const { setMockItem } = setupSessionStorageMock();

  it("saves primitive value to sessionStorage on mount", () => {
    render(SessionStorage);

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      "session-storage-key",
      "test-value",
    );
  });

  it("saves object value as JSON string", () => {
    render(SessionStorage);

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      "theme-settings",
      JSON.stringify({ theme: "dark", fontSize: 16 }),
    );
  });

  it("loads existing primitive value from sessionStorage", () => {
    setMockItem("session-storage-key", "existing-value");

    render(SessionStorage);
    expect(sessionStorage.getItem).toHaveBeenCalledWith("session-storage-key");
  });

  it("loads existing object value from sessionStorage", () => {
    const existingSettings = { theme: "light", fontSize: 14 };
    setMockItem("theme-settings", JSON.stringify(existingSettings));

    render(SessionStorage);
    expect(sessionStorage.getItem).toHaveBeenCalledWith("theme-settings");
  });

  it("clears specific item from sessionStorage", () => {
    const { component } = render(SessionStorage);
    const storage = component.storage;

    if (storage) {
      storage.clearItem();
      expect(sessionStorage.removeItem).toHaveBeenCalledWith(
        "programmatic-key",
      );
    }
  });

  it("clears all items from sessionStorage", () => {
    const { component } = render(SessionStorage);
    const storage = component.storage;

    if (storage) {
      storage.clearAll();
      expect(sessionStorage.clear).toHaveBeenCalled();
    }
  });

  it("handles JSON parse errors gracefully", () => {
    setMockItem("session-storage-key", "{invalid-json}");

    render(SessionStorage);
    expect(sessionStorage.getItem).toHaveBeenCalledWith("session-storage-key");
  });

  it("uses default key if none provided", () => {
    render(SessionStorage);

    expect(sessionStorage.getItem).toHaveBeenCalledWith(
      expect.stringContaining("session-storage-key"),
    );
  });

  describe("Generics", () => {
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

      type ComponentType = SessionStorageComponent<Status>;
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

      type ComponentType = SessionStorageComponent<ThemeSettings>;
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

      type ComponentType = SessionStorageComponent<InferredType>;
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
