import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';
import Component from './Slider.Story.svelte';

export default { title: 'Slider', decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    name: text('Form item name (name)', ''),
    inputType: text('The form element type (inputType)', 'number'),
    ariaLabelInput: text(
      'The ARIA label for the <input> (ariaLabelInput)',
      'Label for slider value'
    ),
    disabled: boolean('Disabled (disabled)', false),
    light: boolean('Light variant (light)', false),
    hideTextInput: boolean('Without text input (hideTextInput)', false),
    min: number('The minimum value (min)', 0),
    max: number('The maximum value (max)', 100),
    step: number('The step (step)', 1),
    stepMuliplier: number('The step factor for Shift+arrow keys (stepMuliplier)', 4),
    labelText: text('Label text (labelText)', 'Slider Label'),
    minLabel: text('Label for minimum value (minLabel)', ''),
    maxLabel: text('Label for maximum value (maxLabel)', ''),
    hideLabel: boolean('Hide label (hideLabel)', false)
  }
});

export const Skeleton = () => ({
  Component,
  props: {
    story: 'skeleton',
    hideLabel: boolean('Hide label (hideLabel)', false)
  }
});
