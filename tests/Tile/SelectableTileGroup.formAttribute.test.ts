import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import SelectableTileGroupFormAttribute from "./SelectableTileGroup.formAttribute.test.svelte";

describe("SelectableTileGroup form attribute", () => {
  it("associates its inputs with the form named by `form`", () => {
    render(SelectableTileGroupFormAttribute);

    expect(new FormData(getForm()).getAll("tiles")).toEqual(["a"]);
  });
});
