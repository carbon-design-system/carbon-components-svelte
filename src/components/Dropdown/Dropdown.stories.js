import { withKnobs, select, text, boolean } from '@storybook/addon-knobs';
import Component from './Dropdown.Story.svelte';

export default { title: 'Dropdown', decorators: [withKnobs] };

const types = {
  'Default (default)': 'default',
  'Inline (inline)': 'inline'
};

const sizes = {
  'Extra large size (xl)': 'xl',
  'Regular size (lg)': '',
  'Small size (sm)': 'sm'
};

export const Default = () => ({
  Component,
  props: {
    id: text('Dropdown ID (id)', 'carbon-dropdown-example'),
    type: select('Dropdown type (type)', types, 'default'),
    size: select('Field size (size)', sizes, '') || undefined,
    label: text('Label (label)', 'Dropdown menu options'),
    'aria-label': text('Aria Label (aria-label)', 'Dropdown'),
    disabled: boolean('Disabled (disabled)', false),
    light: boolean('Light variant (light)', false),
    titleText: text('Title (titleText)', 'This is not a dropdown title.'),
    helperText: text('Helper text (helperText)', 'This is not some helper text.'),
    invalid: boolean('Show form validation UI (invalid)', false),
    invalidText: text('Form validation UI content (invalidText)', 'A valid value is required')
  }
});

export const Skeleton = () => ({ Component, props: { story: 'skeleton' } });
