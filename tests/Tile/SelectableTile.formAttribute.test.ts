import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import SelectableTileFormAttribute from "./SelectableTile.formAttribute.test.svelte";

describe("SelectableTile form attribute", () => {
  it("associates the control with the form named by `form`", () => {
    render(SelectableTileFormAttribute);

    expect(new FormData(getForm()).get("tile")).toBe("a");
  });
});
