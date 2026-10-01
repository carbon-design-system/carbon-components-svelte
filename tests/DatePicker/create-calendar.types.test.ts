// @vitest-environment node
import type {
  CreateCalendarArgs,
  createCalendar,
  resolveOptionValue,
  setErrorHandler,
} from "../../src/DatePicker/create-calendar.js";

describe("create-calendar declarations", () => {
  it("declares every export, and a failed init as null", () => {
    expectTypeOf<Awaited<ReturnType<typeof createCalendar>>>().toBeNullable();
    expectTypeOf<typeof setErrorHandler>().toBeFunction();
    expectTypeOf<typeof resolveOptionValue>().parameters.toEqualTypeOf<
      [instance: object, name: string, value: unknown]
    >();
    expectTypeOf<CreateCalendarArgs["dispatch"]>().parameters.toEqualTypeOf<
      [event: string, detail?: unknown]
    >();
    expectTypeOf<CreateCalendarArgs>().toHaveProperty("isDayBlocked");
  });
});
