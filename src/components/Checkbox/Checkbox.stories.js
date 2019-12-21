import { withKnobs, boolean, text } from '@storybook/addon-knobs';
import Component from './Checkbox.Story.svelte';

export default { title: 'Checkbox', decorators: [withKnobs] };

export const Checked = () => ({
  Component,
  props: {
    labelText: text('Label text (labelText)', 'Checkbox label'),
    indeterminate: boolean('Intermediate (indeterminate)', false),
    disabled: boolean('Disabled (disabled)', false),
    hideLabel: boolean('No label (hideLabel)', false),
    wrapperClass: text('Wrapper CSS class name (wrapperClass)', '')
  }
});

export const Unchecked = () => ({
  Component,
  props: {
    story: 'unchecked',
    labelText: text('Label text (labelText)', 'Checkbox label'),
    indeterminate: boolean('Intermediate (indeterminate)', false),
    disabled: boolean('Disabled (disabled)', false),
    hideLabel: boolean('No label (hideLabel)', false),
    wrapperClass: text('Wrapper CSS class name (wrapperClass)', '')
  }
});

export const Skeleton = () => ({ Component, props: { story: 'skeleton' } });
