// @vitest-environment node
import { RANDOM_ID, renderRaw, renderSSR } from "../utils/ssr";
import FieldRepeater from "./FieldRepeater.test.svelte";

describe("FieldRepeater server render", () => {
  it("renders every item with ids and names derived from `id`", () => {
    const html = renderRaw(FieldRepeater, { items: ["a@x.com", "b@x.com"] });

    expect(html.match(RANDOM_ID)).toBeNull();
    expect(html).toContain('id="emails-0"');
    expect(html).toContain('id="emails-1"');
    expect(html).toContain('name="emails[1]"');
    expect(html).toContain('aria-labelledby="emails-1-label"');
  });

  it("fills the list up to min before the first byte", () => {
    const { document } = renderSSR(FieldRepeater, {
      items: [],
      config: { min: 2 },
    });

    expect(document.querySelectorAll("li")).toHaveLength(2);
  });

  it("renders the empty text for an empty list", () => {
    const { document } = renderSSR(FieldRepeater, { items: [] });

    expect(document.querySelector("li")).toBeNull();
    expect(document.body.textContent).toContain("Nothing added yet");
  });
});
