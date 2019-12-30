import { withKnobs, select, boolean, text } from '@storybook/addon-knobs';
import Component from './Button.Story.svelte';

export default { title: 'Button', decorators: [withKnobs] };

const kinds = {
  'Primary button (primary)': 'primary',
  'Secondary button (secondary)': 'secondary',
  'Danger button (danger)': 'danger',
  'Ghost button (ghost)': 'ghost'
};

const sizes = {
  Default: 'default',
  Field: 'field',
  Small: 'small'
};

export const Default = () => ({
  Component,
  props: {
    kind: select('Button kind (kind)', kinds, 'primary'),
    disabled: boolean('Disabled (disabled)', false),
    size: select('Button size (size)', sizes, 'default'),
    iconDescription: text('Icon description (iconDescription)', 'Button icon'),
    small: boolean('Small (small) - Deprecated in favor of `size`', false)
  }
});

export const IconOnlyButtons = () => ({
  Component,
  props: {
    story: 'icon-only buttons',
    kind: select('Button kind (kind)', kinds, 'primary'),
    disabled: boolean('Disabled (disabled)', false),
    size: select('Button size (size)', sizes, 'default'),
    iconDescription: text('Icon description (iconDescription)', 'Button icon'),
    tooltipPosition: select(
      'Tooltip position (tooltipPosition)',
      ['top', 'right', 'bottom', 'left'],
      'bottom'
    ),
    tooltipAlignment: select(
      'Tooltip alignment (tooltipAlignment)',
      ['start', 'center', 'end'],
      'center'
    )
  }
});

export const SetOfButtons = () => ({
  Component,
  props: {
    story: 'set of buttons',
    disabled: boolean('Disabled (disabled)', false),
    small: boolean('Small (small)', false),
    size: select('Button size (size)', sizes, 'default'),
    iconDescription: text('Icon description (iconDescription)', 'Button icon')
  }
});

export const Skeleton = () => ({ Component, props: { story: 'skeleton' } });
