import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import CheckboxGroupFormAttribute from "./CheckboxGroup.formAttribute.test.svelte";

describe("CheckboxGroup form attribute", () => {
  it("associates its inputs with the form named by `form`", () => {
    render(CheckboxGroupFormAttribute);

    expect(new FormData(getForm()).getAll("fruit")).toEqual(["apple", "pear"]);
  });
});
