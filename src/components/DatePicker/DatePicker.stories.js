import { withKnobs, select, text, boolean } from "@storybook/addon-knobs";
import Component from "./DatePicker.Story.svelte";

export default { title: "DatePicker", decorators: [withKnobs] };

const patterns = {
  "Short (d{1,2}/d{4})": "d{1,2}/d{4}",
  "Regular (d{1,2}/d{1,2}/d{4})": "d{1,2}/d{1,2}/d{4}",
};

export const Default = () => ({
  Component,
  props: {
    datePicker: {
      id: "date-picker",
      light: boolean("Light variant (light in <DatePicker>)", false),
      short: boolean("Use shorter width (short in <DatePicker>)", false),
    },
    datePickerInput: {
      id: "date-picker-input-id",
      name: "date-picker-input-name",
      labelText: text(
        "Label text (labelText in <DatePickerInput>)",
        "Date Picker label"
      ),
      hideLabel: boolean("Hide label (hideLabel)", false),
      pattern: select(
        "The date format (pattern in <DatePickerInput>)",
        patterns,
        "d{1,2}/d{4}"
      ),
      placeholder: text(
        "Placeholder text (placeholder in <DatePickerInput>)",
        "mm/dd/yyyy"
      ),
      disabled: boolean("Disabled (disabled in <DatePickerInput>)", false),
      invalid: boolean(
        "Show form validation UI (invalid in <DatePickerInput>)",
        false
      ),
      invalidText: text(
        "Form validation UI content (invalidText in <DatePickerInput>)",
        "A valid value is required"
      ),
      iconDescription: text(
        "Icon description (iconDescription in <DatePickerInput>)",
        "Icon description"
      ),
    },
  },
});

Default.story = { name: "Default (simple)" };

export const Single = () => ({
  Component,
  props: {
    story: "single",
    datePicker: {
      id: "date-picker",
      light: boolean("Light variant (light in <DatePicker>)", false),
      dateFormat: text("The date format (dateFormat in <DatePicker>)", "m/d/Y"),
    },
    datePickerInput: {
      id: "date-picker-input-id",
      labelText: text(
        "Label text (labelText in <DatePickerInput>)",
        "Date Picker label"
      ),
      hideLabel: boolean("Hide label (hideLabel)", false),
      pattern: select(
        "The date format (pattern in <DatePickerInput>)",
        patterns,
        "d{1,2}/d{4}"
      ),
      placeholder: text(
        "Placeholder text (placeholder in <DatePickerInput>)",
        "mm/dd/yyyy"
      ),
      disabled: boolean("Disabled (disabled in <DatePickerInput>)", false),
      invalid: boolean(
        "Show form validation UI (invalid in <DatePickerInput>)",
        false
      ),
      invalidText: text(
        "Form validation UI content (invalidText in <DatePickerInput>)",
        "A valid value is required"
      ),
      iconDescription: text(
        "Icon description (iconDescription in <DatePickerInput>)",
        "Icon description"
      ),
    },
  },
});

export const Range = () => ({
  Component,
  props: {
    story: "range",
    datePicker: {
      id: "date-picker",
      light: boolean("Light variant (light in <DatePicker>)", false),
      dateFormat: text("The date format (dateFormat in <DatePicker>)", "m/d/Y"),
    },
    datePickerInput: {
      id: "date-picker-input-id",
      labelText: text(
        "Label text (labelText in <DatePickerInput>)",
        "Date Picker label"
      ),
      hideLabel: boolean("Hide label (hideLabel)", false),
      pattern: select(
        "The date format (pattern in <DatePickerInput>)",
        patterns,
        "d{1,2}/d{4}"
      ),
      placeholder: text(
        "Placeholder text (placeholder in <DatePickerInput>)",
        "mm/dd/yyyy"
      ),
      disabled: boolean("Disabled (disabled in <DatePickerInput>)", false),
      invalid: boolean(
        "Show form validation UI (invalid in <DatePickerInput>)",
        false
      ),
      invalidText: text(
        "Form validation UI content (invalidText in <DatePickerInput>)",
        "A valid value is required"
      ),
      iconDescription: text(
        "Icon description (iconDescription in <DatePickerInput>)",
        "Icon description"
      ),
    },
  },
});

export const Skeleton = () => ({ Component, props: { story: "skeleton" } });
