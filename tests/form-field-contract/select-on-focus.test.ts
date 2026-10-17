import { fireEvent, render } from "@testing-library/svelte";
import { tick } from "svelte";
import { clickToFocus } from "../utils/click-to-focus";
import { user } from "../utils/user";
import { cases } from "./cases";
import { controls, type FieldCase } from "./contract";
import FieldHost from "./fixtures/FieldHost.test.svelte";

type SelectCase = FieldCase & {
  selectOnFocus: NonNullable<FieldCase["selectOnFocus"]>;
};

const selectCases = cases
  .filter((c): c is SelectCase => !!c.selectOnFocus)
  .map((c) => [c.name, c] as const);

const renderField = (c: SelectCase, props: Record<string, unknown> = {}) => {
  render(FieldHost, {
    props: {
      component: c.component,
      props: { ...c.props, value: c.selectOnFocus.value, ...props },
    },
  });
  const [input] = controls(c);
  assert(
    input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement,
  );
  return { input, select: vi.spyOn(input, "select") };
};

describe.each(selectCases)("%s selectTextOnFocus", (_, c) => {
  it("selects the value on focus", async () => {
    const { input, select } = renderField(c, { selectTextOnFocus: true });

    await user.click(input);
    await tick();

    expect(select).toHaveBeenCalled();
  });

  it("keeps the selection through the click's mouseup", async () => {
    const { input } = renderField(c, { selectTextOnFocus: true });

    const mouseup = await clickToFocus(input);
    expect(mouseup.defaultPrevented).toBe(true);
  });

  it("is off by default", async () => {
    const { input, select } = renderField(c);

    const mouseup = await clickToFocus(input);
    await tick();

    expect(select).not.toHaveBeenCalled();
    expect(mouseup.defaultPrevented).toBe(false);
  });

  it("does not select when disabled", async () => {
    const { input, select } = renderField(c, {
      selectTextOnFocus: true,
      disabled: true,
    });

    await fireEvent.focus(input);
    await tick();

    expect(select).not.toHaveBeenCalled();
  });
});
