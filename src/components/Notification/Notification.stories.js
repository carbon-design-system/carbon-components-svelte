import { withKnobs, select, boolean, text } from '@storybook/addon-knobs';
import Component from './Notification.Story.svelte';

export default { title: 'Notification', decorators: [withKnobs] };

const kinds = {
  'Error (error)': 'error',
  'Info (info)': 'info',
  'Success (success)': 'success',
  'Warning (warning)': 'warning'
};

export const Toast = () => ({
  Component,
  props: {
    story: 'toast',
    kind: select('The notification kind (kind)', kinds, 'info'),
    lowContrast: boolean('Use low contrast variant (lowContrast)', false),
    role: text('ARIA role (role)', 'alert'),
    title: text('Title (title)', 'Notification title'),
    subtitle: text('Subtitle (subtitle)', 'Subtitle text goes here.'),
    caption: text('Caption (caption)', 'Time stamp [00:00:00]'),
    iconDescription: text('Icon description (iconDescription)', 'describes the close button'),
    hideCloseButton: boolean('Hide close button (hideCloseButton)', false)
  }
});

export const Inline = () => ({
  Component,
  props: {
    story: 'inline',
    kind: select('The notification kind (kind)', kinds, 'info'),
    lowContrast: boolean('Use low contrast variant (lowContrast)', false),
    role: text('ARIA role (role)', 'alert'),
    title: text('Title (title)', 'Notification title'),
    subtitle: text('Subtitle (subtitle)', 'Subtitle text goes here.'),
    caption: text('Caption (caption)', 'Time stamp [00:00:00]'),
    iconDescription: text('Icon description (iconDescription)', 'describes the close button'),
    hideCloseButton: boolean('Hide close button (hideCloseButton)', false),
    action: text('Action (NotificationActionButton > $$slot#action)', 'Action')
  }
});
