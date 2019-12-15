import { withKnobs, select, text } from '@storybook/addon-knobs';
import Component from './TooltipIcon.Story.svelte';

export default { title: 'TooltipIcon', decorators: [withKnobs] };

const directions = {
  'Top (top)': 'top',
  'Right (right)': 'right',
  'Bottom (bottom)': 'bottom',
  'Left (left)': 'left'
};

const alignments = {
  'Start (start)': 'start',
  'Center (center)': 'center',
  'End (end)': 'end'
};

export const Default = () => ({
  Component,
  props: {
    direction: select('Tooltip direction (direction)', directions, 'bottom'),
    align: select('Tooltip alignment (align)', alignments, 'center'),
    tooltipText: text('Tooltip content (tooltipText)', 'Filter')
  }
});
