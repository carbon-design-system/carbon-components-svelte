import { render } from "@testing-library/svelte";
import Cells from "./Cells.test.svelte";

const LOCALES = ["en-US", "de-DE", "ar-EG", "ja-JP", "fr-CH"];
const CONSTRUCTORS = [
  "NumberFormat",
  "DateTimeFormat",
  "RelativeTimeFormat",
] as const;

/** Counts the `Intl` formatters built while `run` runs. */
async function countConstructions(run: () => Promise<void>) {
  const intl: Record<string, unknown> = Intl;
  const original = CONSTRUCTORS.map((name) => [name, intl[name]] as const);
  let built = 0;
  for (const [name, Original] of original) {
    intl[name] = new Proxy(Original as new (...args: unknown[]) => object, {
      construct(target, args, newTarget) {
        built += 1;
        return Reflect.construct(target, args, newTarget);
      },
    });
  }
  try {
    await run();
  } finally {
    for (const [name, Original] of original) intl[name] = Original;
  }
  return built;
}

describe("a locale switch over 200 formatted cells", () => {
  it("builds one formatter per locale, not one per cell", async () => {
    const { rerender } = render(Cells, { locale: "en-US" });

    const first = await countConstructions(async () => {
      for (const locale of LOCALES.slice(1)) {
        // eslint-disable-next-line no-await-in-loop -- each switch must settle first
        await rerender({ locale });
      }
    });
    // The relative time, its title and its direction: three per locale.
    expect(first).toBe((LOCALES.length - 1) * 3);

    // Every locale is cached now, so going round again builds nothing.
    const second = await countConstructions(async () => {
      for (const locale of LOCALES) {
        // eslint-disable-next-line no-await-in-loop -- each switch must settle first
        await rerender({ locale });
      }
    });
    expect(second).toBe(0);
  });
});
