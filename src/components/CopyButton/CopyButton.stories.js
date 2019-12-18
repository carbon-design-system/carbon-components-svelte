import { withKnobs, text, number } from '@storybook/addon-knobs';
import Component from './CopyButton.Story.svelte';

export default { title: 'CopyButton', decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    feedback: text('The text shown upon clicking (feedback)', 'Copied!'),
    feedbackTimeout: number('How long the text is shown upon clicking (feedbackTimeout)', 2000),
    iconDescription: text('Feedback icon description (iconDescription)', 'Copy to clipboard')
  }
});
