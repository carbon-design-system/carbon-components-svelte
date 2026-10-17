// @vitest-environment node
import type {
  CreateCalendarArgs,
  createCalendar,
  resolveLocale,
  resolveOptionValue,
  setErrorHandler,
  updateMonthNode,
} from "../../src/DatePicker/create-calendar.js";

describe("create-calendar declarations", () => {
  it("declares every export, and a failed init as null", () => {
    expectTypeOf<Awaited<ReturnType<typeof createCalendar>>>().toBeNullable();
    expectTypeOf<typeof resolveLocale>().toBeFunction();
    expectTypeOf<typeof resolveOptionValue>().parameters.toEqualTypeOf<
      [instance: object, name: string, value: unknown]
    >();
    expectTypeOf<typeof setErrorHandler>().toBeFunction();
    expectTypeOf<typeof updateMonthNode>().toBeFunction();
    expectTypeOf<CreateCalendarArgs["dispatch"]>().parameters.toEqualTypeOf<
      [event: string, detail?: unknown]
    >();
    expectTypeOf<CreateCalendarArgs>().toHaveProperty("isDayBlocked");
  });
});
