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

/** Every element under `root` whose `attr` holds the `token` id. */
const holders = (root: HTMLElement, attr: string, token: string) => [
  ...root.querySelectorAll<HTMLElement>(`[${attr}~="${token}"]`),
];

describe.each(cases.map((c) => [title(c), c] as const))("%s", (_, c) => {
  afterEach(cleanup);

  it.skipIf(c.skip?.["aria-describedby"])(
    "puts a consumer aria-describedby on the target, after built-in ids",
    () => {
      const result = c.render({ "aria-describedby": CONSUMER_DESCRIPTION_ID });
      const target = c.target(result);

      const ids = target.getAttribute("aria-describedby")?.split(" ") ?? [];
      expect(ids.at(-1)).toBe(CONSUMER_DESCRIPTION_ID);
      expect(
        holders(
          result.baseElement,
          "aria-describedby",
          CONSUMER_DESCRIPTION_ID,
        ),
      ).toEqual([target]);
    },
  );

  it.skipIf(c.skip?.["aria-labelledby"])(
    "puts a consumer aria-labelledby on the target",
    () => {
      const result = c.render({ "aria-labelledby": CONSUMER_LABEL_ID });
      const target = c.target(result);

      expect(
        target.getAttribute("aria-labelledby")?.split(" ") ?? [],
      ).toContain(CONSUMER_LABEL_ID);
      expect(
        holders(result.baseElement, "aria-labelledby", CONSUMER_LABEL_ID),
      ).toEqual([target]);
    },
  );

  it.skipIf(c.skip?.["aria-label"])(
    "names the target with a consumer aria-label",
    () => {
      const result = c.render({ "aria-label": CONSUMER_LABEL });
      const target = c.target(result);

      expect(target).toHaveAccessibleName(new RegExp(CONSUMER_LABEL));
      const stray = [
        ...result.baseElement.querySelectorAll<HTMLElement>(
          `[aria-label="${CONSUMER_LABEL}"]`,
        ),
      ].filter((el) => el !== target);
      expect(stray).toEqual([]);
    },
  );
});
