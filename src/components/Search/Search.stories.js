import { withKnobs, select, boolean, text } from '@storybook/addon-knobs';
import Component from './Search.Story.svelte';

export default { title: 'Search', decorators: [withKnobs] };

const sizes = {
  'Regular size (xl)': 'xl',
  'Large size (lg)': 'lg',
  'Small size (sm)': 'sm'
};

export const Default = () => ({
  Component,
  props: {
    size: select('Size (size)', sizes, 'xl'),
    light: boolean('Light variant (light)', false),
    name: text('Form item name (name)', ''),
    labelText: text('Label text (labelText)', 'Search'),
    closeButtonLabelText: text(
      'The label text for the close button (closeButtonLabelText)',
      'Clear search input'
    ),
    placeholder: text('Placeholder text (placeholder)', 'Search')
  }
});

export const Skeleton = () => ({ Component, props: { story: 'skeleton' } });
