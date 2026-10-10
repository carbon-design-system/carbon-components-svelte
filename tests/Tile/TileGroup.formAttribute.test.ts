import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import TileGroupFormAttribute from "./TileGroup.formAttribute.test.svelte";

describe("TileGroup form attribute", () => {
  it("associates its inputs with the form named by `form`", () => {
    render(TileGroupFormAttribute);

    expect(new FormData(getForm()).get("tier")).toBe("b");
  });
});
