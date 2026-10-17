import { render } from "@testing-library/svelte";
import { getBoundText } from "../utils/get-bound-text";
import { getForm } from "../utils/get-form";
import { resetForm } from "../utils/reset-form";
import { user } from "../utils/user";
import { cases } from "./cases";
import { controls, type FieldCase, title } from "./contract";
import FormHost from "./fixtures/FormHost.test.svelte";

type ResetCase = FieldCase & { reset: NonNullable<FieldCase["reset"]> };

const resetCases = cases
  .filter((c): c is ResetCase => !!c.reset)
  .map((c) => [title(c), c] as const);

const inputs = (c: FieldCase) =>
  controls(c).map((control) => {
    assert(
      control instanceof HTMLInputElement ||
        control instanceof HTMLTextAreaElement,
    );
    return control;
  });

/** The field's value as the user sees it, across all its controls. */
const shown = (c: FieldCase) =>
  inputs(c)
    .map((input) => input.value)
    .join("");

const typeInto = async (c: ResetCase) => {
  await user.click(inputs(c)[0]);
  await user.keyboard(c.reset.typed);
};

describe.each(resetCases)("%s form reset", (_, c) => {
  const renderField = (props: Record<string, unknown> = {}) =>
    render(FormHost, {
      props: { component: c.component, fieldProps: c.props, ...props },
    });

  it("clears the typed value and the binding", async () => {
    renderField();

    await typeInto(c);
    expect(getBoundText()).not.toBe("");

    await resetForm();

    expect(shown(c)).toBe("");
    expect(getBoundText()).toBe("");
  });

  it.skipIf(c.reset.submits === false)(
    "clears the submitted value",
    async () => {
      renderField();

      await typeInto(c);
      await resetForm();

      expect(new FormData(getForm()).get("field")).toBe("");
    },
  );

  it("clears a value set on the client, like the browser does", async () => {
    renderField({ value: c.reset.initial });

    await resetForm();

    expect(shown(c)).toBe("");
    expect(getBoundText()).toBe("");
  });

  it("restores a server-rendered default", async () => {
    renderField({ value: c.reset.initial });
    if (c.reset.serverDefault) c.reset.serverDefault(c.reset.initial);
    else inputs(c)[0].defaultValue = c.reset.initial;

    await typeInto(c);
    expect(getBoundText()).not.toBe(c.reset.initial);

    await resetForm();

    expect(shown(c)).toBe(c.reset.initial);
    expect(getBoundText()).toBe(c.reset.initial);
  });

  it("leaves everything alone when the reset is canceled", async () => {
    renderField();
    getForm().addEventListener("reset", (event) => event.preventDefault());

    await typeInto(c);
    const typed = getBoundText();
    await resetForm();

    expect(getBoundText()).toBe(typed);
    expect(shown(c)).not.toBe("");
  });

  it("dispatches no events on reset", async () => {
    const handlers = { onInput: vi.fn(), onChange: vi.fn(), onClear: vi.fn() };
    renderField(handlers);

    await typeInto(c);
    await user.tab();
    for (const event of c.reset.events) {
      expect(
        event === "input" ? handlers.onInput : handlers.onChange,
      ).toHaveBeenCalled();
    }
    for (const handler of Object.values(handlers)) handler.mockClear();

    await resetForm();

    for (const handler of Object.values(handlers)) {
      expect(handler).not.toHaveBeenCalled();
    }
  });
});
