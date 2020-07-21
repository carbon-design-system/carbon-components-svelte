import { withKnobs, boolean } from "@storybook/addon-knobs";
import Component from "./ContentSwitcher.Story.svelte";

export default { title: "ContentSwitcher", decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    disabled: boolean("Disabled (disabled)", false),
    light: boolean("Light variant (light)", false),
  },
});

export const Selected = () => ({
  Component,
  props: {
    story: "selected",
    disabled: boolean("Disabled (disabled)", false),
    light: boolean("Light variant (light)", false),
  },
});
