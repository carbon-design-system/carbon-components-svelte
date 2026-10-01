// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import Select from "./Select.ssr.test.svelte";

describe("Select server render", () => {
  it("marks the `selected` option", () => {
    const { document } = renderSSR(Select, { selected: "md" });
    const options = [...document.querySelectorAll("option")];

    expect(options.map((option) => option.hasAttribute("selected"))).toEqual([
      false,
      true,
      false,
    ]);
  });
});
