// @vitest-environment node

import { renderRaw } from "../utils/ssr";
import StructuredListSsr from "./StructuredListSsr.test.svelte";

describe("StructuredList server render", () => {
  const props = { name: "plan" };

  it("renders identical markup for an explicit name", () => {
    expect(renderRaw(StructuredListSsr, props)).toBe(
      renderRaw(StructuredListSsr, props),
    );
  });

  it("shares the name across the radio inputs", () => {
    const html = renderRaw(StructuredListSsr, props);

    expect(html.match(/name="plan"/g)).toHaveLength(2);
    expect(html).toContain('id="plan-a"');
    expect(html).toContain('for="plan-a"');
  });

  it("names no input in multiple mode", () => {
    const html = renderRaw(StructuredListSsr, { ...props, multiple: true });

    expect(html).toContain('type="checkbox"');
    expect(html).not.toContain('name="plan"');
  });
});
