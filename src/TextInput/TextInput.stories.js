import { withKnobs, boolean, text, select } from "@storybook/addon-knobs";
import Component from "./TextInput.Story.svelte";

export default { title: "TextInput", decorators: [withKnobs] };

const sizes = {
  "Extra large size (xl)": "xl",
  "Default size": undefined,
  "Small size (sm)": "sm",
};

export const Default = () => ({
  Component,
  props: {
    size: select("Field size (size)", sizes, undefined) || undefined,
    disabled: boolean("Disabled (disabled)", false),
    light: boolean("Light variant (light)", false),
    hideLabel: boolean("No label (hideLabel)", false),
    labelText: text("Label text (labelText)", "Text Input label"),
    helperText: text("Helper text (helperText)", "Optional helper text here"),
    invalid: boolean("Show form validation UI (invalid)", false),
    invalidText: text(
      "Content of form validation UI (invalidText)",
      "A valid value is required"
    ),
    warn: boolean("Show warning state (warn)", false),
    warnText: text(
      "Warning state text (warnText)",
      "This will overwrite your current settings"
    ),
    placeholder: text("Placeholder text (placeholder)", "Placeholder text."),
    inline: boolean("Inline variant (inline)", false),
    id: text("TextInput id", "text-input-id"),
    name: text("TextInput name", "text-input-name"),
  },
});

export const Fluid = () => ({
  Component,
  props: {
    story: 'fluid',
    size: select("Field size (size)", sizes, undefined) || undefined,
    disabled: boolean("Disabled (disabled)", false),
    light: boolean("Light variant (light)", false),
    hideLabel: boolean("No label (hideLabel)", false),
    labelText: text("Label text (labelText)", "Text Input label"),
    helperText: text("Helper text (helperText)", "Optional helper text here"),
    invalid: boolean("Show form validation UI (invalid)", false),
    invalidText: text(
      "Content of form validation UI (invalidText)",
      "A valid value is required"
    ),
    warn: boolean("Show warning state (warn)", false),
    warnText: text(
      "Warning state text (warnText)",
      "This will overwrite your current settings"
    ),
    placeholder: text("Placeholder text (placeholder)", "Placeholder text."),
    inline: boolean("Inline variant (inline)", false),
    id: text("TextInput id", "text-input-id"),
    name: text("TextInput name", "text-input-name"),
  },
});

export const TogglePasswordVisibility = () => ({
  Component,
  props: {
    story: "password-visibility",
    size: select("Field size (size)", sizes, undefined) || undefined,
    disabled: boolean("Disabled (disabled)", false),
    light: boolean("Light variant (light)", false),
    hideLabel: boolean("No label (hideLabel)", false),
    labelText: text("Label text (labelText)", "Text Input label"),
    helperText: text("Helper text (helperText)", "Optional helper text here"),
    invalid: boolean("Show form validation UI (invalid)", false),
    invalidText: text(
      "Content of form validation UI (invalidText)",
      "A valid value is required"
    ),
    placeholder: text("Placeholder text (placeholder)", "Placeholder text."),
    id: text("TextInput id", "text-input-id"),
    name: text("TextInput name", "text-input-name"),
    tooltipPosition: select(
      "Tooltip position (tooltipPosition)",
      ["top", "right", "bottom", "left"],
      "bottom"
    ),
    tooltipAlignment: select(
      "Tooltip alignment (tooltipAlignment)",
      ["start", "center", "end"],
      "center"
    ),
    hidePasswordLabel: text(
      '"Hide password" tooltip label for password visibility toggle (hidePasswordLabel)',
      "Hide password"
    ),
    showPasswordLabel: text(
      '"Show password" tooltip label for password visibility toggle (showPasswordLabel)',
      "Show password"
    ),
  },
});

export const ControlledTogglePasswordVisibility = () => ({
  Component,
  props: {
    story: "controlled",
    size: select("Field size (size)", sizes, undefined) || undefined,
    disabled: boolean("Disabled (disabled)", false),
    light: boolean("Light variant (light)", false),
    hideLabel: boolean("No label (hideLabel)", false),
    labelText: text("Label text (labelText)", "Text Input label"),
    helperText: text("Helper text (helperText)", "Optional helper text here"),
    invalid: boolean("Show form validation UI (invalid)", false),
    invalidText: text(
      "Content of form validation UI (invalidText)",
      "A valid value is required"
    ),
    placeholder: text("Placeholder text (placeholder)", "Placeholder text."),
    id: text("TextInput id", "text-input-id"),
    name: text("TextInput name", "text-input-name"),
    tooltipPosition: select(
      "Tooltip position (tooltipPosition)",
      ["top", "right", "bottom", "left"],
      "bottom"
    ),
    tooltipAlignment: select(
      "Tooltip alignment (tooltipAlignment)",
      ["start", "center", "end"],
      "center"
    ),
    hidePasswordLabel: text(
      '"Hide password" tooltip label for password visibility toggle (hidePasswordLabel)',
      "Hide password"
    ),
    showPasswordLabel: text(
      '"Show password" tooltip label for password visibility toggle (showPasswordLabel)',
      "Show password"
    ),
  },
});

export const Skeleton = () => ({ Component, props: { story: "skeleton" } });
