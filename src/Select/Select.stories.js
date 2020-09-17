import { withKnobs, text, boolean, select } from "@storybook/addon-knobs";
import Component from "./Select.Story.svelte";

export default { title: "Select", decorators: [withKnobs] };

const sizes = {
  "Extra large size (xl)": "xl",
  "Default size": undefined,
  "Small size (sm)": "sm",
};

export const Default = () => ({
  Component,
  props: {
    select: {
      size: select("Field size (size)", sizes, undefined) || undefined,
      light: boolean("Light variant (light in <Select>)", false),
      inline: boolean(
        "Put control in-line with label (inline in <Select>)",
        false
      ),
      disabled: boolean("Disabled (disabled in <Select>)", false),
      hideLabel: boolean("No label (hideLabel in <Select>)", false),
      invalid: boolean("Show form validation UI (invalid in <Select>)", false),
      invalidText: text(
        "Form validation UI content (invalidText in <Select>)",
        "A valid value is required"
      ),
      labelText: text("Label text (helperText)", "Select"),
      helperText: text("Helper text (helperText)", "Optional helper text here"),
      id: text("Select id", "select-id"),
      name: text("Select name", "select-name"),
    },
    group: {
      disabled: boolean("Disabled (disabled in <SelectItemGroup>)", false),
    },
  },
});

export const Skeleton = () => ({
  Component,
  props: {
    story: "skeleton",
    hideLabel: boolean("No label (hideLabel in <Select>)", false),
  },
});
