// @vitest-environment node

import FormGroup from "carbon-components-svelte/FormGroup/FormGroup.svelte";
import { render } from "svelte/server";

/** Server output with only Svelte's hydration comments removed. */
function renderRaw(props: Record<string, unknown>) {
  return render(FormGroup, { props }).body.replace(/<!--[\s\S]*?-->/g, "");
}

describe("FormGroup server render", () => {
  const props = {
    id: "group",
    legendText: "Legend",
    message: true,
    messageText: "Pick one",
  };

  it("renders identical markup for an explicit id", () => {
    expect(renderRaw(props)).toBe(renderRaw(props));
  });

  it("derives the message id from the id", () => {
    const html = renderRaw(props);

    expect(html).toContain('<fieldset id="group"');
    expect(html).toContain('aria-describedby="group-message"');
    expect(html).toContain('id="group-message"');
  });
});
