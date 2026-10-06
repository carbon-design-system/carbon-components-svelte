// @vitest-environment node

import { render } from "svelte/server";
import StructuredListSsr from "./StructuredListSsr.test.svelte";

/** Server output with only Svelte's hydration comments removed. */
function renderRaw(props: Record<string, unknown>) {
  return render(StructuredListSsr, { props }).body.replace(
    /<!--[\s\S]*?-->/g,
    "",
  );
}

describe("StructuredList server render", () => {
  const props = { name: "plan" };

  it("renders identical markup for an explicit name", () => {
    expect(renderRaw(props)).toBe(renderRaw(props));
  });

  it("shares the name across the radio inputs", () => {
    const html = renderRaw(props);

    expect(html.match(/name="plan"/g)).toHaveLength(2);
    expect(html).toContain('id="plan-a"');
    expect(html).toContain('for="plan-a"');
  });

  it("names no input in multiple mode", () => {
    const html = renderRaw({ ...props, multiple: true });

    expect(html).toContain('type="checkbox"');
    expect(html).not.toContain('name="plan"');
  });

  it("does not set the name on the list element", () => {
    expect(renderRaw(props)).not.toMatch(/<div[^>]*name="plan"/);
  });
});
