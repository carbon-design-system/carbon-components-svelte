// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import Menu from "./Menu.ssr.test.svelte";

describe("Menu server render", () => {
  it("renders nothing while closed", () => {
    expect(renderSSR(Menu).html).toBe("");
  });
});
