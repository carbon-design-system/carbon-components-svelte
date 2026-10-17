import { cleanup, render } from "@testing-library/svelte";
import { computeAccessibleName } from "dom-accessibility-api";
import { tick } from "svelte";
import FieldA11y from "./FieldA11y.test.svelte";

/**
 * Renders every form field across combinations of its status props and
 * checks the accessibility wiring that's easy to break in one field
 * without noticing: ids that point at nothing, rendered helper or message
 * text no control refers to, `labelText` missing from the accessible
 * name, an invalid message that isn't announced, and an invalid field
 * without `aria-invalid`.
 */

const FIELDS = [
  "TextInput",
  "PasswordInput",
  "TextArea",
  "NumberInput",
  "Search",
  "CopyInput",
  "PinCodeInput",
  "TimePicker",
  "Toggle",
  "Checkbox",
  "Slider",
  "RangeSlider",
  "ComboBox",
  "Dropdown",
  "MultiSelect",
  "Select",
  "DatePicker",
  "CheckboxGroup",
  "RadioButtonGroup",
] as const;

type Field = (typeof FIELDS)[number];

const GROUPS = new Set<Field>(["CheckboxGroup", "RadioButtonGroup"]);

/** Fields without an `invalid` prop. */
const NO_INVALID = new Set<Field>(["CopyInput", "Toggle"]);

/**
 * Known gaps, keyed `Field check`, with what fixes them. A gap that
 * disappears doesn't fail the test, so fixes can merge in any order;
 * remove its entry when it does.
 */
const KNOWN: Record<string, string> = {
  "Checkbox invalid-not-alert": "role=alert follow-up after #4272",
  "CheckboxGroup invalid-not-alert": "role=alert follow-up after #4272",
  "RadioButtonGroup invalid-not-alert": "role=alert follow-up after #4272",
  "Select invalid-not-alert": "role=alert follow-up after #4272",
  "MultiSelect invalid-not-alert": "role=alert follow-up after #4271",
};

const IDREF_ATTRIBUTES = [
  "aria-describedby",
  "aria-errormessage",
  "aria-labelledby",
];

const CONTROLS = [
  'input:not([type="hidden"])',
  "select",
  "textarea",
  '[role="slider"]',
  '[role="combobox"]',
  '[role="switch"]',
  '[role="searchbox"]',
].join(", ");

/** Every combination of the status props, with and without FluidForm. */
function combinations() {
  return Array.from({ length: 128 }, (_, n) => {
    const bit = (i: number) => Boolean(n & (1 << i));
    return {
      fluid: bit(6),
      props: {
        invalid: bit(0),
        invalidText: bit(1) ? "ERR" : "",
        warn: bit(2),
        warnText: bit(3) ? "WRN" : "",
        helperText: bit(4) ? "HLP" : "",
        readonly: bit(5),
      },
    };
  });
}

function describeCombination(fluid: boolean, props: Record<string, unknown>) {
  const set = Object.entries(props)
    .filter(([, value]) => value)
    .map(([key]) => key);
  return [fluid ? "fluid" : "", ...set].filter(Boolean).join(" ") || "none";
}

/** The field's own controls, not menu options or calendar days. */
function controlsIn(container: HTMLElement) {
  return [...container.querySelectorAll(CONTROLS)].filter(
    (element) =>
      !element.closest(".bx--list-box__menu, .flatpickr-calendar") &&
      !element.matches("button:not([role=combobox])"),
  );
}

function idsIn(element: Element, attribute: string) {
  return (element.getAttribute(attribute) ?? "").split(/\s+/).filter(Boolean);
}

async function sweep(field: Field) {
  const findings = new Map<string, { detail: string; example: string }>();
  const report = (check: string, detail: string, example: string) => {
    const key = `${field} ${check}`;
    if (!findings.has(key)) findings.set(key, { detail, example });
  };

  for (const { fluid, props } of combinations()) {
    const example = describeCombination(fluid, props);
    const { container } = render(FieldA11y, {
      props: { kind: field, fluid, props },
    });
    // biome-ignore lint/performance/noAwaitInLoops: each combination mounts, settles, and unmounts before the next
    await tick();

    for (const attribute of [...IDREF_ATTRIBUTES, "for"]) {
      for (const element of container.querySelectorAll(`[${attribute}]`)) {
        if (attribute === "for" && element.localName !== "label") continue;
        for (const id of idsIn(element, attribute)) {
          if (!document.getElementById(id)) {
            report("dangling-idref", `${attribute} -> ${id}`, example);
          }
        }
      }
    }

    const referenced = new Set(
      [
        ...container.querySelectorAll(
          "[aria-describedby], [aria-errormessage]",
        ),
      ].flatMap((element) => [
        ...idsIn(element, "aria-describedby"),
        ...idsIn(element, "aria-errormessage"),
      ]),
    );
    for (const text of container.querySelectorAll(
      ".bx--form__helper-text, .bx--form-requirement",
    )) {
      const content = text.textContent?.trim();
      if (content && !(text.id && referenced.has(text.id))) {
        report("unreferenced-text", `"${content}"`, example);
      }
    }

    if (GROUPS.has(field)) {
      const fieldset = container.querySelector("fieldset");
      const name = fieldset ? computeAccessibleName(fieldset) : "";
      if (!name.includes("LBL")) {
        report("label-not-in-name", `fieldset "${name}"`, example);
      }
    } else {
      for (const control of controlsIn(container)) {
        const name = computeAccessibleName(control);
        if (!name.includes("LBL")) {
          report(
            "label-not-in-name",
            `${control.localName} "${name}"`,
            example,
          );
        }
      }
    }

    for (const message of container.querySelectorAll(".bx--form-requirement")) {
      if (
        message.textContent?.trim() === "ERR" &&
        !message.closest('[role="alert"]')
      ) {
        report("invalid-not-alert", "invalid message", example);
      }
    }

    if (props.readonly) {
      const focusable = controlsIn(container).filter(
        (control) =>
          !control.hasAttribute("disabled") &&
          (control as HTMLElement).tabIndex >= 0,
      );
      if (focusable.length === 0) {
        report("readonly-unfocusable", "no focusable control", example);
      }
    }

    if (props.invalid && !props.readonly && !NO_INVALID.has(field)) {
      const marked =
        controlsIn(container).some(
          (control) => control.getAttribute("aria-invalid") === "true",
        ) ||
        container.querySelector(
          'fieldset[aria-invalid="true"], [role="radiogroup"][aria-invalid="true"]',
        );
      if (!marked) report("no-aria-invalid", "no aria-invalid", example);
    }

    cleanup();
  }

  return findings;
}

describe("form field accessibility", () => {
  it.each(FIELDS)(
    "%s wires labels, descriptions, and invalid state",
    async (field) => {
      const findings = await sweep(field);
      const unexpected = [...findings]
        .filter(([key]) => !(key in KNOWN))
        .map(([key, { detail, example }]) => `${key}: ${detail} (${example})`);

      expect(unexpected).toEqual([]);
    },
    60_000,
  );
});
