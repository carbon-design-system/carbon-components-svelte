import { withKnobs, boolean, text } from '@storybook/addon-knobs';
import Component from './Link.Story.svelte';

export default { title: 'Link', decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    href: text('The link href (href)', '#'),
    inline: boolean('Use the in-line variant (inline)', false),
    disabled: boolean('Disabled (disabled)', false)
  }
});
