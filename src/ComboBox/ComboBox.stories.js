import { withKnobs, select, boolean, text } from "@storybook/addon-knobs";
import Component from "./ComboBox.Story.svelte";

export default { title: "ComboBox", decorators: [withKnobs] };

const sizes = {
  "Extra large size (xl)": "xl",
  "Regular size (lg)": "",
  "Small size (sm)": "sm",
};

export const Default = () => ({
  Component,
  props: {
    size: select("Field size (size)", sizes, ""),
    placeholder: text("Placeholder text (placeholder)", "Filter..."),
    titleText: text("Title (titleText)", "Combobox title"),
    light: boolean("Light (light)", false),
    disabled: boolean("Disabled (disabled)", false),
    invalid: boolean("Invalid (invalid)", false),
    invalidText: text(
      "Invalid text (invalidText)",
      "A valid value is required"
    ),
    name: "combo-box-name",
  },
});
