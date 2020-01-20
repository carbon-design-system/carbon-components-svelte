import { withKnobs, select, boolean, text } from '@storybook/addon-knobs';
import Component from './MultiSelect.Story.svelte';

export default { title: 'MultiSelect', decorators: [withKnobs] };

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
    id: 'multiselect',
    titleText: text('Title (titleText)', 'Multiselect Title'),
    helperText: text('Helper text (helperText)', 'This is not helper text'),
    filterable: boolean('Filterable (filterable)', false),
    selectionFeedback: select(
      'Selection feedback (selectionFeedback)',
      ['top', 'fixed', 'top-after-reopen'],
      'top-after-reopen'
    ),
    disabled: boolean('Disabled (disabled)', false),
    light: boolean('Light variant (light)', false),
    useTitleInItem: boolean('Show tooltip on hover', false),
    type: select('UI type (Only for `<MultiSelect>`) (type)', types, 'default'),
    size: select('Field size (size)', sizes, '') || undefined,
    label: text('Label (label)', 'MultiSelect Label'),
    invalid: boolean('Show form validation UI (invalid)', false),
    invalidText: text('Form validation UI content (invalidText)', 'Invalid Selection')
  }
});
