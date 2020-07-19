import { withKnobs, boolean, text, number } from "@storybook/addon-knobs";
import Component from "./TextArea.Story.svelte";

export default { title: "TextArea", decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    id: text("TextArea id", "text-area-id"),
    name: text("TextArea name", "text-area-name"),
    disabled: boolean("Disabled (disabled)", false),
    light: boolean("Light variant (light)", false),
    hideLabel: boolean("No label (hideLabel)", false),
    labelText: text("Label text (labelText)", "Text Area label"),
    invalid: boolean("Show form validation UI (invalid)", false),
    invalidText: text(
      "Content of form validation UI (invalidText)",
      "A valid value is required"
    ),
    placeholder: text("Placeholder text (placeholder)", "Placeholder text."),
    cols: number("Columns (columns)", 50),
    rows: number("Rows (rows)", 4),
  },
});

export const Skeleton = () => ({ Component, props: { story: "skeleton" } });
