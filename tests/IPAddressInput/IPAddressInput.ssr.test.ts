// @vitest-environment node
import { render } from "svelte/server";
import IPAddressInputSsr from "./IPAddressInputSsr.test.svelte";

describe("IPAddressInput server render", () => {
  const html = render(IPAddressInputSsr).body;

  it("renders the preview and points the field at it", () => {
    expect(html).toContain("256 addresses");
    expect(html).toContain("10.0.0.255");
    expect(html).toMatch(/aria-describedby="[^"]*ip-preview-subnet/);
  });

  it("renders a parse error for a field that validates on input", () => {
    expect(html).toContain("Octet 4 is greater than 255");
    expect(html).toContain('aria-invalid="true"');
  });

  it("renders the list's entries and one hidden input each", () => {
    expect(html).toMatch(
      /<input type="hidden" name="sources" value="10.0.0.0\/24"/,
    );
    expect(html).toMatch(
      /<input type="hidden" name="sources" value="::1\/128"/,
    );
  });
});
