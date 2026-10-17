// @vitest-environment node

import FormGroup from "carbon-components-svelte/FormGroup/FormGroup.svelte";
import { renderRaw } from "../utils/ssr";

describe("FormGroup server render", () => {
  const props = {
    id: "group",
    legendText: "Legend",
    message: true,
    messageText: "Pick one",
  };

  it("renders identical markup for an explicit id", () => {
    expect(renderRaw(FormGroup, props)).toBe(renderRaw(FormGroup, props));
  });

  it("derives the message id from the id", () => {
    const html = renderRaw(FormGroup, props);

    expect(html).toContain('<fieldset id="group"');
    expect(html).toContain('aria-describedby="group-message"');
    expect(html).toContain('id="group-message"');
  });
});
