// @vitest-environment node
import { render } from "svelte/server";
import PeoplePickerSsr from "./PeoplePicker.ssr.test.svelte";

describe("PeoplePicker server render", () => {
  it("renders the initial people, the +N chip, hidden inputs and a labelled combobox", () => {
    const html = render(PeoplePickerSsr).body;

    expect(html).toContain('<label for="people"');
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-expanded="false"');
    // Three of four are shown, the same as the client's first render.
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("Design");
    expect(html).toContain("+1");
    expect(html).not.toContain(">Four<");
    expect(html).toMatch(/<input type="hidden" name="people" value="1"/);
    expect(html).toMatch(/<input type="hidden" name="people" value="g1"/);
    // An invalid entry is shown, flagged for assistive tech, and not submitted.
    expect(html).toContain("not a valid email address");
    expect(html).not.toMatch(/name="people" value="bad"/);
    // The menu is a client-only portal.
    expect(html).not.toContain('role="listbox"');
  });
});
