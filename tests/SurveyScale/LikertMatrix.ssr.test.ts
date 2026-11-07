// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import LikertMatrix from "./LikertMatrix.test.svelte";

describe("LikertMatrix server render", () => {
  it("renders the table with each answer checked", () => {
    const { document } = renderSSR(LikertMatrix, {
      value: { quick: 4, team: 1 },
    });
    const checked = [
      ...document.querySelectorAll<HTMLInputElement>("input[checked]"),
    ].map((input) => input.value);

    expect(document.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(document.querySelectorAll('input[type="radio"]')).toHaveLength(10);
    expect(checked).toEqual(["4", "1"]);
  });
});
