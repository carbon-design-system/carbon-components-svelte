import { withKnobs, select, text } from '@storybook/addon-knobs';
import Component from './Tooltip.Story.svelte';

export default { title: 'Tooltip', decorators: [withKnobs] };

const directions = {
  'Top (top)': 'top',
  'Right (right)': 'right',
  'Bottom (bottom)': 'bottom',
  'Left (left)': 'left'
};

export const Default = () => ({
  Component,
  props: {
    direction: select('Tooltip direction (direction)', directions, 'bottom'),
    triggerText: text('Trigger text (triggerText)', 'Tooltip label'),
    tabindex: text('Tab index (tabindex in <Tooltip>)', '0')
  }
});

export const NoIcon = () => ({
  Component,
  props: {
    story: 'no icon',
    hideIcon: true,
    direction: select('Tooltip direction (direction)', directions, 'bottom'),
    triggerText: text('Trigger text (triggerText)', 'Tooltip label'),
    tabindex: text('Tab index (tabindex in <Tooltip>)', '0')
  }
});

export const CustomIcon = () => ({
  Component,
  props: {
    story: 'custom icon',
    showIcon: true,
    direction: select('Tooltip direction (direction)', directions, 'bottom'),
    triggerText: text('Trigger text (triggerText)', 'Tooltip label'),
    tabindex: text('Tab index (tabindex in <Tooltip>)', '0')
  }
});

export const CustomIconOnly = () => ({
  Component,
  props: {
    story: 'custom icon only',
    direction: select('Tooltip direction (direction)', directions, 'bottom'),
    iconDescription: 'Helpful Information',
    tabindex: text('Tab index (tabindex in <Tooltip>)', '0')
  }
});

export const UncontrolledTooltip = () => ({
  Component,
  props: {
    story: 'uncontrolled',
    direction: select('Tooltip direction (direction)', directions, 'bottom')
  }
});
