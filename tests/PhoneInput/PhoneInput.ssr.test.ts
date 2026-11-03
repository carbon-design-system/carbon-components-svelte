// @vitest-environment node
import { renderRaw } from "../utils/ssr";
import PhoneInput from "./PhoneInput.test.svelte";

describe("PhoneInput server render", () => {
  it("renders the number formatted for the country read from the value", () => {
    const html = renderRaw(PhoneInput, { value: "+442079460958" });

    expect(html).toContain('value="020 7946 0958"');
    expect(html).toContain('value="+44"');
  });

  it("renders the hidden E.164 field for a name", () => {
    const html = renderRaw(PhoneInput, {
      value: "+14155550123",
      name: "phone",
    });

    expect(html).toContain('type="hidden"');
    expect(html).toContain('value="+14155550123"');
  });

  it("draws the flag's box without reading the browser", () => {
    expect(renderRaw(PhoneInput, { country: "CH" })).toContain("bx--flag");
  });
});
