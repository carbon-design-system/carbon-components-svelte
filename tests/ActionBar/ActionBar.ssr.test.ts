// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import ActionBar from "./ActionBar.test.svelte";
import ActionBarFields from "./ActionBarFields.test.svelte";

describe("ActionBar server render", () => {
  it("renders every button, with no trigger and nothing collapsed", () => {
    const { document } = renderSSR(ActionBar, {});
    const toolbar = document.querySelector('[role="toolbar"]');
    expect(toolbar?.getAttribute("aria-label")).toBe("Formatting");
    expect(toolbar?.getAttribute("aria-orientation")).toBe("horizontal");
    expect(toolbar?.querySelectorAll("button")).toHaveLength(7);
    expect(toolbar?.querySelectorAll("[role=separator]")).toHaveLength(2);
    expect(
      document.querySelector(".bx--action-bar__button--collapsed"),
    ).toBeNull();
    expect(
      document.querySelector(".bx--action-bar__divider--collapsed"),
    ).toBeNull();
    expect(document.querySelector(".bx--action-bar__more")).toBeNull();
  });

  it("leaves the tab order native until the bar mounts", () => {
    const { document } = renderSSR(ActionBar, {});
    for (const button of document.querySelectorAll(".bx--action-bar button")) {
      expect(button.getAttribute("tabindex")).toBe("0");
    }
  });

  it("gives the fields in its items the bar's height", () => {
    const sizes = (size: "xs" | "sm" | "md" | "lg") => {
      const { document } = renderSSR(ActionBarFields, { size });
      return [
        document.querySelector(".bx--dropdown")?.className,
        ...[...document.querySelectorAll(".bx--search")].map(
          (node) => node.className,
        ),
        document.querySelector(".bx--text-input")?.className,
      ];
    };
    expect(sizes("sm")).toEqual([
      expect.stringContaining("bx--dropdown--sm"),
      expect.stringContaining("bx--search--sm"),
      // A field's own size wins.
      expect.stringContaining("bx--search--xl"),
      expect.stringContaining("bx--text-input--sm"),
    ]);
    expect(sizes("md")).toEqual([
      expect.not.stringMatching(/--(sm|xs|xl)\b/),
      expect.stringContaining("bx--search--lg"),
      expect.stringContaining("bx--search--xl"),
      expect.not.stringMatching(/--(sm|xs|xl)\b/),
    ]);
    expect(sizes("lg")).toEqual([
      expect.stringContaining("bx--dropdown--xl"),
      expect.stringContaining("bx--search--xl"),
      expect.stringContaining("bx--search--xl"),
      expect.stringContaining("bx--text-input--xl"),
    ]);
  });

  it("renders the states of the buttons", () => {
    const { document } = renderSSR(ActionBar, {});
    const names = (selector: string) =>
      [...document.querySelectorAll(selector)].map(
        (node) =>
          node.querySelector(".bx--assistive-text")?.firstChild?.textContent,
      );
    expect(names('[aria-disabled="true"]')).toEqual(["Undo"]);
    expect(names('[aria-pressed="false"]')).toEqual(["Bold"]);
    expect(names('[aria-checked="true"]')).toEqual(["Left"]);
    expect(document.querySelector('[role="radiogroup"]')).not.toBeNull();
  });
});
