import { render } from "@testing-library/svelte";
import type SessionStorageComponent from "carbon-components-svelte/SessionStorage/SessionStorage.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { tick } from "svelte";
import { setupSessionStorageMock } from "../utils/storage-mocks";
import SessionStorage from "./SessionStorage.test.svelte";

describe("SessionStorage", () => {
  const storageMock = setupSessionStorageMock();

  it("clearItem removes the key from storage and resets the bound value", async () => {
    const { setMockItem, getMockItem } = storageMock;
    const { component } = render(SessionStorage);
    await tick();
    setMockItem("other-key", "kept");

    component.storage?.clearItem();
    await tick();

    expect(sessionStorage.removeItem).toHaveBeenCalledWith("programmatic-key");
    expect(getMockItem("programmatic-key")).toBeUndefined();
    expect(getMockItem("other-key")).toBe("kept");
    expect(component.programmaticValue).toBeUndefined();
  });

  it("clearAll empties storage and resets the bound value", async () => {
    const { setMockItem, getMockItem } = storageMock;
    const { component } = render(SessionStorage);
    await tick();
    setMockItem("other-key", "gone");

    component.storage?.clearAll();
    await tick();

    expect(sessionStorage.clear).toHaveBeenCalled();
    expect(getMockItem("programmatic-key")).toBeUndefined();
    expect(getMockItem("other-key")).toBeUndefined();
    expect(component.programmaticValue).toBeUndefined();
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
  });
});
