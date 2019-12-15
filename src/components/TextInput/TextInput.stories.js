import { withKnobs, boolean, text, select } from '@storybook/addon-knobs';
import Component from './TextInput.Story.svelte';

export default { title: 'TextInput', decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    disabled: boolean('Disabled (disabled)', false),
    light: boolean('Light variant (light)', false),
    hideLabel: boolean('No label (hideLabel)', false),
    labelText: text('Label text (labelText)', 'Text Input label'),
    invalid: boolean('Show form validation UI (invalid)', false),
    invalidText: text('Content of form validation UI (invalidText)', 'A valid value is required'),
    helperText: text('Helper text (helperText)', 'Optional helper text.'),
    placeholder: text('Placeholder text (placeholder)', 'Placeholder text.'),
    id: 'text-input'
  }
});

export const TogglePasswordVisibility = () => ({
  Component,
  props: {
    story: 'password-visibility',
    disabled: boolean('Disabled (disabled)', false),
    light: boolean('Light variant (light)', false),
    hideLabel: boolean('No label (hideLabel)', false),
    labelText: text('Label text (labelText)', 'Text Input label'),
    invalid: boolean('Show form validation UI (invalid)', false),
    invalidText: text('Content of form validation UI (invalidText)', 'A valid value is required'),
    helperText: text('Helper text (helperText)', 'Optional helper text.'),
    placeholder: text('Placeholder text (placeholder)', 'Placeholder text.'),
    id: 'text-input',
    tooltipPosition: select(
      'Tooltip position (tooltipPosition)',
      ['top', 'right', 'bottom', 'left'],
      'bottom'
    ),
    tooltipAlignment: select(
      'Tooltip alignment (tooltipAlignment)',
      ['start', 'center', 'end'],
      'center'
    ),
    hidePasswordLabel: text(
      '"Hide password" tooltip label for password visibility toggle (hidePasswordLabel)',
      'Hide password'
    ),
    showPasswordLabel: text(
      '"Show password" tooltip label for password visibility toggle (showPasswordLabel)',
      'Show password'
    )
  }
});

export const ControlledTogglePasswordVisibility = () => ({
  Component,
  props: {
    story: 'controlled',
    disabled: boolean('Disabled (disabled)', false),
    light: boolean('Light variant (light)', false),
    hideLabel: boolean('No label (hideLabel)', false),
    labelText: text('Label text (labelText)', 'Text Input label'),
    invalid: boolean('Show form validation UI (invalid)', false),
    invalidText: text('Content of form validation UI (invalidText)', 'A valid value is required'),
    helperText: text('Helper text (helperText)', 'Optional helper text.'),
    placeholder: text('Placeholder text (placeholder)', 'Placeholder text.'),
    id: 'text-input',
    tooltipPosition: select(
      'Tooltip position (tooltipPosition)',
      ['top', 'right', 'bottom', 'left'],
      'bottom'
    ),
    tooltipAlignment: select(
      'Tooltip alignment (tooltipAlignment)',
      ['start', 'center', 'end'],
      'center'
    ),
    hidePasswordLabel: text(
      '"Hide password" tooltip label for password visibility toggle (hidePasswordLabel)',
      'Hide password'
    ),
    showPasswordLabel: text(
      '"Show password" tooltip label for password visibility toggle (showPasswordLabel)',
      'Show password'
    )
  }
});

export const Skeleton = () => ({ Component, props: { story: 'skeleton' } });
