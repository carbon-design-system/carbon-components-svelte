// @vitest-environment node
import type {
  createCalendar,
  CreateCalendarArgs,
} from "../../src/DatePicker/create-calendar.js";

describe("create-calendar declarations", () => {
  it("declares every export, and a failed init as null", () => {
    expectTypeOf<Awaited<ReturnType<typeof createCalendar>>>().toBeNullable();
    expectTypeOf<CreateCalendarArgs["dispatch"]>().parameters.toEqualTypeOf<
      [event: string, detail?: unknown]
    >();
    expectTypeOf<CreateCalendarArgs>().toHaveProperty("isDayBlocked");
  });
});
