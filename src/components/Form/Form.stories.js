import { withKnobs, text, boolean } from '@storybook/addon-knobs';
import Component from './Form.Story.svelte';

export default { title: 'Form', decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    legendText: text('Text in <legend> (legendText)', 'Checkbox heading'),
    message: boolean('Show form requirement (message)', false),
    messageText: text('Form requirement text (messageText)', ''),
    invalid: boolean('Mark as invalid (invalid)', false)
  }
});
