import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import { cases } from "./cases";
import { type CollectionCase, type Mode, title } from "./contract";

/** Runs every case through `Host`, which replaces the collection in place. */
export function describeMutatedInPlace(
  mode: Mode,
  Host: Parameters<typeof render>[0],
) {
  describe.each(cases.map((c) => [title(c), c] as const))(
    `%s replaced in place (${mode})`,
    (_, c: CollectionCase) => {
      const test = c.fails?.[mode] ? it.fails : it;

      test("shows the new contents", async () => {
        let instance: unknown;
        render(Host, {
          props: {
            component: c.component,
            prop: c.prop,
            initial: c.initial(),
            replacement: c.replacement(),
            props: c.props ?? {},
            onInstance: (rendered: unknown) => {
              instance = rendered;
            },
          },
        });
        await user.click(
          screen.getByRole("button", { name: "Replace in place" }),
        );
        await c.check(instance);
      });
    },
  );
}
