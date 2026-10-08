import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import DataTableFormAttribute from "./DataTable.formAttribute.test.svelte";

describe("DataTable form attribute", () => {
  it("associates the selection inputs with the form named by `inputForm`", () => {
    render(DataTableFormAttribute);

    expect(new FormData(getForm()).get("row")).toBe("b");
  });
});
