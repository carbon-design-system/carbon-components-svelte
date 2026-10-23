// @vitest-environment node
import { contrast, THEMES, themeTokens } from "./helpers";

// A toast's action is a small tertiary button with no fill, so its label
// sits on the toast's own background. Small text needs 4.5:1.
const KINDS = [
  "error",
  "info",
  "info-square",
  "success",
  "warning",
  "warning-alt",
] as const;

const ACTION = ".bx--toast-notification__action-button";
const HIGH = `.bx--toast-notification--high-contrast ${ACTION}`;

async function theme(name: (typeof THEMES)[number]) {
  const { rules, themes } = await themeTokens();
  const tokens = themes[name];
  const decl = (selector: string, prop: string) => {
    const rule = rules.find((r) => r.selector === selector && r.context === "");
    const value = rule?.decls.get(prop);
    expect(value, `${selector} { ${prop} }`).toBeDefined();
    return String(value);
  };
  // Follow `var()` chains, such as Gray 100's
  // notification-background-error -> layer.
  const resolve = (value: string): string => {
    const name = value.match(/^var\((--[\w-]+)\)$/)?.[1];
    return name ? resolve(tokens[name]) : value;
  };
  return { rules, decl, resolve };
}

describe("toast action contrast", () => {
  it.each(THEMES)(
    "the resting label passes on every kind in %s",
    async (name) => {
      const { decl, resolve } = await theme(name);
      for (const kind of KINDS) {
        for (const low of [false, true]) {
          const toast = low
            ? `.bx--toast-notification--low-contrast-${kind}`
            : `.bx--toast-notification--${kind}`;
          const background = resolve(decl(toast, "background"));
          const color = resolve(
            decl(low ? ".bx--btn--tertiary" : HIGH, "color"),
          );
          expect(background, toast).toMatch(/^#[\da-f]{6}$/);
          expect(color, toast).toMatch(/^#[\da-f]{6}$/);
          expect(
            contrast(color, background),
            `${color} on ${toast} ${background}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    },
    30_000,
  );

  it.each(THEMES)(
    "the high-contrast hover, focus and active labels pass in %s",
    async (name) => {
      const { rules, decl, resolve } = await theme(name);
      const hover = rules.find(
        (r) =>
          r.selector === `${HIGH}:hover` &&
          r.context === "@media (any-hover:hover)",
      );
      const states = [
        [
          "hover",
          String(hover?.decls.get("color")),
          String(hover?.decls.get("background-color")),
        ],
        ...["focus", "active"].map((state) => [
          state,
          decl(`${HIGH}:${state}`, "color"),
          decl(`${HIGH}:${state}`, "background-color"),
        ]),
      ];
      for (const [state, color, background] of states) {
        expect(
          contrast(resolve(color), resolve(background)),
          `${state}: ${color} on ${background}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    },
    30_000,
  );
});
