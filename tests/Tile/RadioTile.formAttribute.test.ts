import { render } from "@testing-library/svelte";
import { getForm } from "../utils/get-form";
import RadioTileFormAttribute from "./RadioTile.formAttribute.test.svelte";

describe("RadioTile form attribute", () => {
  it("associates the control with the form named by `form`", () => {
    render(RadioTileFormAttribute);

    expect(new FormData(getForm()).get("tier")).toBe("b");
  });
});
