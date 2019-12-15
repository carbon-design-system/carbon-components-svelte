import { withKnobs, text, select, boolean } from '@storybook/addon-knobs';
import Component from './RadioButton.Story.svelte';

export default { title: 'RadioButton', decorators: [withKnobs] };

const labelPositions = {
  'Left (left)': 'left',
  'Right (right)': 'right'
};

export const Default = () => ({
  Component,
  props: {
    name: text('Form item name (name)', 'test'),
    value: text('Value (value)', 'standard'),
    labelText: text('Label text (labelText)', 'Standard Radio Button'),
    labelPosition: select('Label position (labelPosition)', labelPositions, 'right'),
    disabled: boolean('Disabled (disabled)', false)
  }
});

export const Skeleton = () => ({ Component, props: { story: 'skeleton' } });
