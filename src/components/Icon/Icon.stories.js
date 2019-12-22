import { withKnobs, select, boolean } from '@storybook/addon-knobs';
import Component from './Icon.Story.svelte';

export default { title: 'Icon', decorators: [withKnobs] };

const icons = {
  ChevronDown16: 'ChevronDown16',
  ArrowLeft20: 'ArrowLeft20',
  Add24: 'Add24'
};

export const Default = () => ({
  Component,
  props: {
    icon: select('Render icon from `carbon-icons-svelte` (render)', icons, 'ChevronDown16'),
    skeleton: boolean('Display icon skeleton (skeleton)', false)
  }
});

export const Skeleton = () => ({ Component, props: { story: 'skeleton' } });
