import { withKnobs, number, boolean, text } from "@storybook/addon-knobs";
import Component from "./TimePicker.Story.svelte";

export default { title: "TimePicker", decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    timepicker: {
      pattern: text(
        "Regular expression for the value (pattern in <TimePicker>)",
        "(1[012]|[1-9]):[0-5][0-9](\\s)?"
      ),
      placeholder: text(
        "Placeholder text (placeholder in <TimePicker>)",
        "hh:mm"
      ),
      disabled: boolean("Disabled (disabled in <TimePicker>)", false),
      light: boolean("Light variant (light in <TimePicker>)", false),
      hideLabel: boolean("No label (hideLabel in <TimePicker>)", false),
      labelText: text(
        "Label text (labelText in <TimePicker>)",
        "Select a time"
      ),
      invalid: boolean(
        "Show form validation UI (invalid in <TimePicker>)",
        false
      ),
      invalidText: text(
        "Form validation UI content (invalidText in <TimePicker>)",
        "A valid value is required"
      ),
      maxlength: number("Maximum length (maxlength in <TimePicker>)", 5),
      id: text("TimePicker id", "time-picker-id"),
      name: text("TimePicker name", "time-picker-name"),
    },
    select: {
      disabled: boolean("Disabled (disabled in <TimePickerSelect>)", false),
      hideLabel: boolean("No label (hideLabel in <TimePickerSelect>)", true),
      labelText: text(
        "Label text (labelText in <TimePickerSelect>)",
        "Please select"
      ),
      iconDescription: text(
        "Trigger icon description (iconDescription in <TimePickerSelect>)",
        "open list of options"
      ),
      id: text("TimePickerSelect id", "time-picker-select-id"),
      name: text("TimePickerSelect name", "time-picker-select-name"),
    },
  },
});
