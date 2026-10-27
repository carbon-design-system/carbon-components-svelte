// @vitest-environment node
// @depends-on css/vendor/carbon-components/scss/globals/scss/**
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  duration,
  easing,
  easingCss,
  motion,
} from "../../src/motion/tokens.js";

const SCSS = join(
  __dirname,
  "../../css/vendor/carbon-components/scss/globals/scss",
);
const durations = readFileSync(join(SCSS, "_motion.scss"), "utf8");
const easings = readFileSync(
  join(SCSS, "vendor/@carbon/elements/scss/motion/motion.scss"),
  "utf8",
);

/** `$carbon--easings` as `{ name: { mode: "cubic-bezier(...)" } }`. */
function sassEasings() {
  const map = /\$carbon--easings:\s*\(([\s\S]*?)\n\);/.exec(easings)?.[1] ?? "";
  const result: Record<string, Record<string, string>> = {};
  let name = "";
  for (const line of map.split("\n")) {
    const group = /^\s*(\w+):\s*\($/.exec(line);
    if (group) {
      name = group[1];
      result[name] = {};
    }
    const curve = /^\s*(\w+):\s*(cubic-bezier\([^)]*\))/.exec(line);
    if (curve) result[name][curve[1]] = curve[2];
  }
  return result;
}

describe("motion tokens", () => {
  it("durations equal the Sass $duration--* values", () => {
    const sass = Object.fromEntries(
      [...durations.matchAll(/^\$duration--([\w-]+):\s*(\d+)ms/gm)].map(
        ([, name, ms]) => [name.replace("-", ""), Number(ms)],
      ),
    );
    expect(sass).toEqual({ ...duration });
  });

  it("pins slow02 to the @carbon/motion value, not the v10 720", () => {
    expect(duration.slow02).toBe(700);
  });

  it("easingCss equals the elements $carbon--easings map", () => {
    const sass = sassEasings();
    expect(Object.keys(sass)).toEqual(["standard", "entrance", "exit"]);
    expect(easingCss).toEqual(sass);
  });

  it("motion() mirrors the Sass function and defaults", () => {
    expect(motion()).toBe(easingCss.standard.productive);
    expect(motion("exit", "expressive")).toBe("cubic-bezier(0.4, 0.14, 1, 1)");
    // @ts-expect-error an unknown easing name
    expect(() => motion("bounce")).toThrow(/Unknown motion easing "bounce"/);
  });

  it("every easing function runs from 0 to 1", () => {
    for (const modes of Object.values(easing)) {
      for (const fn of Object.values(modes)) {
        expect(fn(0)).toBe(0);
        expect(fn(1)).toBe(1);
      }
    }
  });
});
