// @vitest-environment node
import { createMask } from "../../src/utils/input-mask.js";
import { renderRaw } from "../utils/ssr";
import Mask from "./Mask.test.svelte";

describe("mask server render", () => {
  it("renders the field with the value it was given, and touches no browser global", () => {
    const html = renderRaw(Mask, { value: "(415) 555-0123" });

    expect(html).toContain('value="(415) 555-0123"');
    expect(html).not.toContain("data-ccs-mask");
  });

  it("formats an initial value on the server with createMask", () => {
    const { value } = createMask("(999) 999-9999").format("4155550123");

    expect(renderRaw(Mask, { value })).toContain('value="(415) 555-0123"');
  });
});
