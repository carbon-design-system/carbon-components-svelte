import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';
import Component from './NumberInput.Story.svelte';

export default { title: 'NumberInput', decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    id: 'number-input',
    label: text('Label (label)', 'Number Input label'),
    hideLabel: boolean('Hide label (hideLabel)', false),
    min: number('Minimum value (min)', 0),
    max: number('Maximum value (max)', 100),
    value: number('Value (value)', 50),
    step: number('Step of up/down arrow (step)', 10),
    disabled: boolean('Disabled (disabled)', false),
    readonly: boolean('Read only (readonly)', false),
    invalid: boolean('Show form validation UI (invalid)', false),
    mobile: boolean('Mobile variant (mobile)', false),
    invalidText: text('Form validation UI content (invalidText)', 'Number is not valid'),
    helperText: text('Helper text (helperText)', 'Optional helper text.'),
    light: boolean('Light variant (light)', false)
  }
});

export const Skeleton = () => ({
  Component,
  props: {
    story: 'skeleton',
    hideLabel: boolean('Hide label (hideLabel)', false)
  }
});
