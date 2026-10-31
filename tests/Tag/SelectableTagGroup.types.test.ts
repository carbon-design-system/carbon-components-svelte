// @vitest-environment node
import type { ComponentEvents, ComponentProps } from "svelte";
import type SelectableTagGroup from "../../src/Tag/SelectableTagGroup.svelte";

type Status = "open" | "closed";

describe("SelectableTagGroup declarations", () => {
  it("types `selected` and `change` from the `Value` generic", () => {
    type Group = SelectableTagGroup<Status>;

    expectTypeOf<ComponentProps<Group>["selected"]>().toEqualTypeOf<
      ReadonlyArray<Status> | undefined
    >();
    expectTypeOf<ComponentEvents<Group>["change"]["detail"]>().toEqualTypeOf<
      ReadonlyArray<Status>
    >();
  });

  it("accepts every tag size, as SelectableTag does", () => {
    expectTypeOf<ComponentProps<SelectableTagGroup>["size"]>().toEqualTypeOf<
      "xs" | "sm" | "default" | "lg" | "md" | undefined
    >();
  });

  it("defaults `Value` to string | number", () => {
    expectTypeOf<
      ComponentProps<SelectableTagGroup>["selected"]
    >().toEqualTypeOf<ReadonlyArray<string | number> | undefined>();
  });
});
