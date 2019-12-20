import { withKnobs, select } from '@storybook/addon-knobs';
import Component from './SkeletonPlaceholder.Story.svelte';

export default { title: 'SkeletonPlaceholder', decorators: [withKnobs] };

const classes = {
  'my--skeleton__placeholder--small': 'my--skeleton__placeholder--small',
  'my--skeleton__placeholder--medium': 'my--skeleton__placeholder--medium',
  'my--skeleton__placeholder--large': 'my--skeleton__placeholder--large'
};

export const Default = () => ({
  Component,
  props: {
    class: select('Classes with different sizes', classes)
  }
});
