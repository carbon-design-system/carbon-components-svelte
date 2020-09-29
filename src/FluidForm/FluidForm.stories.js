import { withKnobs, boolean } from "@storybook/addon-knobs";
import Component from "./FluidForm.Story.svelte";

export default { title: "FluidForm", decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    // remove props on publish
    inputInvalid: boolean('input is invalid', false),
    passwordInvalid: boolean('password is invalid', false)
  }
});