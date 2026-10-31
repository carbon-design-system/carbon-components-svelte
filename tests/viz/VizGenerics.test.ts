import { render } from "@testing-library/svelte";
import VizGenerics from "./VizGenerics.test.svelte";

// The assertions are the `@ts-expect-error` comments in the fixture, which
// `test:types` checks; rendering keeps the fixture compiled and mounted.
describe("viz generics", () => {
  it("mounts every chart with inferred accessor keys", () => {
    const { container } = render(VizGenerics);
    expect(container.querySelectorAll("figure")).toHaveLength(7);
  });
});
