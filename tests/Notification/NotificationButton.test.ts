import type NotificationButtonComponent from "carbon-components-svelte/Notification/NotificationButton.svelte";
import type { ComponentProps } from "svelte";

describe("NotificationButton Generics", () => {
  it("should support custom Icon types with generics", () => {
    type CustomIcon = new (...args: unknown[]) => unknown;

    type ComponentType = NotificationButtonComponent<CustomIcon>;
    type Props = ComponentProps<ComponentType>;

    expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
  });

  it("should default to any type when generic is not specified", () => {
    type ComponentType = NotificationButtonComponent;
    type Props = ComponentProps<ComponentType>;

    // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
    expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
  });
});
