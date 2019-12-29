import { withKnobs, boolean, number } from '@storybook/addon-knobs';
import Component from './ProgressIndicator.Story.svelte';

export default { title: 'ProgressIndicator', decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    currentIndex: number('Current progress (currentIndex)', 1),
    vertical: boolean('Vertical orientation (vertical)', false)
  }
});

export const Interactive = () => ({
  Component,
  props: {
    story: 'interactive',
    currentIndex: number('Current progress (currentIndex)', 1),
    vertical: boolean('Vertical orientation (vertical)', false)
  }
});

export const Skeleton = () => ({
  Component,
  props: {
    story: 'skeleton',
    vertical: boolean('Vertical orientation (vertical)', false)
  }
});
