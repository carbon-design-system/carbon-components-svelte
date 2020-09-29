import { withKnobs } from "@storybook/addon-knobs";
import Component from "./FluidForm.Story.svelte";

export default { title: "FluidForm", decorators: [withKnobs] };

export const Default = () => ({
  Component,
});