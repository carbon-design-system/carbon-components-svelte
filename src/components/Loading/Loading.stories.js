import { withKnobs, boolean, text } from '@storybook/addon-knobs';
import Component from './Loading.Story.svelte';

export default { title: 'Loading', decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    active: boolean('Active (active)', true),
    withOverlay: boolean('With overlay (withOverlay)', false),
    small: boolean('Small (small)', false),
    description: text('Description (description)', 'Active loading indicator')
  }
});
