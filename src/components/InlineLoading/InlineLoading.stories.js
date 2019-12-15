import { withKnobs, select, text, number } from '@storybook/addon-knobs';
import Component from './InlineLoading.Story.svelte';

export default { title: 'InlineLoading', decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    status: select(
      'Loading status (status)',
      ['inactive', 'active', 'finished', 'error'],
      'active'
    ),
    iconDescription: text('Icon description (iconDescription)', 'Active loading indicator'),
    description: text('Loading progress description (description)', 'Loading data...'),
    successDelay: number(
      'The duration for successful state before `onSuccess` fires (successDelay)',
      1500
    )
  }
});

export const UxExample = () => ({
  Component,
  props: { story: 'ux-example' }
});

UxExample.story = {
  name: 'UX Example'
};
