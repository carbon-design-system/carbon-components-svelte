import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import SelectManyNumericItems from "./SelectManyNumericItems.test.svelte";

describe("Select registration batching", () => {
  // Every `SelectItem` registers its value's type with the parent `Select`
  // from its own script body during the same synchronous mount pass (see
  // `batchStoreUpdates` in Select.svelte). This renders many items at once
  // and picks a late one, so a bug that dropped or mis-ordered an item's
  // registration during the batched flush would surface as a value coerced
  // to the wrong type (string, from the native <select>) instead of number.
  it("coerces the selected value's type correctly for every item after a large batch registers at once", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(SelectManyNumericItems, { count: 40 });

    const selectElement = screen.getByLabelText("Select label");
    await user.selectOptions(selectElement, "39");

    expect(consoleLog).toHaveBeenCalledWith("update", 39);
  });
});
