import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import ActionSetKinds from "./ActionSet.kinds.test.svelte";
import ActionSetSizeOverride from "./ActionSet.sizeOverride.test.svelte";
import ActionSet from "./ActionSet.test.svelte";

describe("ActionSet", () => {
  it("renders slotted Button children inside a presentation wrapper", () => {
    render(ActionSet, { count: 2 });

    const actionSet = screen.getByTestId("action-set");
    expect(actionSet).toHaveClass("bx--action-set");
    expect(actionSet).toHaveClass("bx--btn-set");
    expect(actionSet).toHaveAttribute("role", "presentation");

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent("Cancel");
    expect(buttons[1]).toHaveTextContent("Delete");
  });

  it("sets the size layout class from the `size` prop", () => {
    render(ActionSet, { size: "lg", count: 2 });

    expect(screen.getByTestId("action-set")).toHaveClass("bx--action-set--lg");
  });

  it.each([
    ["sm", 2, false, "bx--action-set--stacking", true],
    ["md", 3, false, "bx--action-set--stacking", true],
    ["md", 1, false, "bx--action-set--row-single", false],
    ["md", 2, false, "bx--action-set--row-double", false],
    ["lg", 3, false, "bx--action-set--row-triple", false],
    ["lg", 4, false, "bx--action-set--row-quadruple", false],
    ["sm", 2, true, "bx--action-set--row-double", false],
  ] as const)(
    "at size %s with %i actions (disableStacking=%s) it has %s",
    async (size, count, disableStacking, expectedClass, stacked) => {
      render(ActionSet, { size, count, disableStacking });

      const actionSet = screen.getByTestId("action-set");
      await waitFor(() => expect(actionSet).toHaveClass(expectedClass));
      expect(actionSet.classList.contains("bx--action-set--stacking")).toBe(
        stacked,
      );
      expect(actionSet.classList.contains("bx--btn-set--stacked")).toBe(
        stacked,
      );
    },
  );

  it("re-measures stacking when actions are added or removed after mount", async () => {
    const { rerender } = render(ActionSet, { size: "md", count: 2 });
    const actionSet = screen.getByTestId("action-set");
    await waitFor(() =>
      expect(actionSet).toHaveClass("bx--action-set--row-double"),
    );

    await rerender({ count: 3 });
    await waitFor(() =>
      expect(actionSet).toHaveClass("bx--action-set--stacking"),
    );

    await rerender({ count: 2 });
    await waitFor(() =>
      expect(actionSet).toHaveClass("bx--action-set--row-double"),
    );
    expect(actionSet).not.toHaveClass("bx--action-set--stacking");
  });

  it("applies the sticky class when sticky is set", () => {
    render(ActionSet, { sticky: true });

    expect(screen.getByTestId("action-set")).toHaveClass(
      "bx--action-set--sticky",
    );
  });

  it("cascades its size to child buttons that don't set their own, without overriding one that does", () => {
    render(ActionSetSizeOverride);

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveTextContent("Cancel");
    expect(buttons[0]).toHaveClass("bx--btn--sm");
    expect(buttons[1]).toHaveTextContent("Save");
    expect(buttons[1]).toHaveClass("bx--btn--field");
    expect(buttons[1]).not.toHaveClass("bx--btn--sm");
  });

  it.each([
    ["sm", "bx--btn--sm"],
    ["md", "bx--btn--field"],
    ["lg", null],
    ["xl", "bx--btn--lg"],
    ["2xl", "bx--btn--xl"],
  ] as const)(
    "maps the %s size to the child button's size class",
    (size, expected) => {
      render(ActionSetSizeOverride, { size });

      const sizeClasses = [
        "bx--btn--xs",
        "bx--btn--sm",
        "bx--btn--field",
        "bx--btn--lg",
        "bx--btn--xl",
      ];
      const button = screen.getAllByRole("button")[0];
      expect(sizeClasses.filter((c) => button.classList.contains(c))).toEqual(
        expected ? [expected] : [],
      );
    },
  );

  describe("validation", () => {
    it.each([
      [["secondary", "primary"], "lg", []],
      [["ghost", "secondary", "danger", "primary"], "xl", []],
      [["primary", "primary"], "lg", ["takes at most one primary action"]],
      [["ghost", "danger-ghost"], "lg", ["takes at most one ghost action"]],
      [
        ["ghost", "secondary", "tertiary", "danger", "primary"],
        "xl",
        ["takes at most four actions"],
      ],
      [
        ["ghost", "primary"],
        "sm",
        ["can't stack a ghost action with other actions"],
      ],
      [
        ["secondary", "tertiary", "danger", "primary"],
        "sm",
        ["takes at most three actions when they stack"],
      ],
    ] as const)(
      "warns about %j at size %s: %j",
      async (kinds, size, problems) => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        render(ActionSetKinds, { props: { kinds: [...kinds], size } });
        await tick();

        expect(warn.mock.calls.map(([message]) => message)).toEqual(
          problems.map(
            (problem) => `[ActionSet.svelte] an action set ${problem}.`,
          ),
        );
        warn.mockRestore();
      },
    );

    it("warns about a problem once, however often the actions change", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { rerender } = render(ActionSetKinds, {
        props: { kinds: ["primary", "primary"] },
      });
      await tick();
      await rerender({ kinds: ["primary", "primary", "secondary"] });
      await tick();

      expect(warn).toHaveBeenCalledTimes(1);
      warn.mockRestore();
    });
  });
});
