import { cleanup } from "@testing-library/svelte";
import { entries } from "./cases";
import {
  type AriaCase,
  CONSUMER_DESCRIPTION_ID,
  CONSUMER_LABEL,
  CONSUMER_LABEL_ID,
  isExempt,
} from "./contract";

const cases = entries.filter((entry): entry is AriaCase => !isExempt(entry));
const title = (c: AriaCase) =>
  c.variant ? `${c.name} (${c.variant})` : c.name;

const targetsOf = (c: AriaCase, result: ReturnType<AriaCase["render"]>) =>
  [c.target(result)].flat();

const tokens = (el: HTMLElement, attr: string) =>
  el.getAttribute(attr)?.split(" ").filter(Boolean) ?? [];

/** Every element under `root` whose `attr` holds the `token` id. */
const holders = (root: HTMLElement, attr: string, token: string) => [
  ...root.querySelectorAll<HTMLElement>(`[${attr}~="${token}"]`),
];

/** The targets hold the attribute, and nothing else does. */
const expectOnlyTargets = (found: HTMLElement[], targets: HTMLElement[]) => {
  expect(found).toHaveLength(targets.length);
  expect(found).toEqual(expect.arrayContaining(targets));
};

describe.each(cases.map((c) => [title(c), c] as const))("%s", (_, c) => {
  afterEach(cleanup);

  it.skipIf(c.skip?.["aria-describedby"])(
    "joins a consumer aria-describedby after the built-in ids on the target",
    () => {
      // Built-in ids can come from `uniqueId`, so compare counts across
      // renders, not the ids themselves.
      const builtIn = targetsOf(c, c.render({})).map(
        (el) => tokens(el, "aria-describedby").length,
      );
      cleanup();

      const result = c.render({ "aria-describedby": CONSUMER_DESCRIPTION_ID });
      const targets = targetsOf(c, result);

      targets.forEach((target, i) => {
        const ids = tokens(target, "aria-describedby");
        expect(ids.at(-1)).toBe(CONSUMER_DESCRIPTION_ID);
        expect(ids).toHaveLength(builtIn[i] + 1);
      });
      expectOnlyTargets(
        holders(
          result.baseElement,
          "aria-describedby",
          CONSUMER_DESCRIPTION_ID,
        ),
        targets,
      );
    },
  );

  it.skipIf(c.skip?.["aria-labelledby"])(
    "puts a consumer aria-labelledby on the target",
    () => {
      const result = c.render({ "aria-labelledby": CONSUMER_LABEL_ID });
      const targets = targetsOf(c, result);

      for (const target of targets) {
        expect(tokens(target, "aria-labelledby")).toContain(CONSUMER_LABEL_ID);
      }
      expectOnlyTargets(
        holders(result.baseElement, "aria-labelledby", CONSUMER_LABEL_ID),
        targets,
      );
    },
  );

  it.skipIf(c.skip?.["aria-label"])(
    "names the target with a consumer aria-label",
    () => {
      const result = c.render({ "aria-label": CONSUMER_LABEL });
      const targets = targetsOf(c, result);

      for (const target of targets) {
        expect(target).toHaveAccessibleName(new RegExp(CONSUMER_LABEL));
      }
      const stray = [
        ...result.baseElement.querySelectorAll<HTMLElement>(
          `[aria-label="${CONSUMER_LABEL}"]`,
        ),
      ].filter((el) => !targets.includes(el));
      expect(stray).toEqual([]);
    },
  );
});
