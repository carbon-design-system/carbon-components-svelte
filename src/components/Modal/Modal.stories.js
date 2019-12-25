import { withKnobs, boolean, text, select } from '@storybook/addon-knobs';
import Component from './Modal.Story.svelte';

export default { title: 'Modal', decorators: [withKnobs] };

const sizes = {
  Default: '',
  'Extra small (xs)': 'xs',
  'Small (sm)': 'sm',
  'Large (lg)': 'lg'
};

export const Default = () => ({
  Component,
  props: {
    open: boolean('Open (open)', true),
    passiveModal: boolean('Without footer (passiveModal)', false),
    danger: boolean('Danger mode (danger)', false),
    shouldSubmitOnEnter: boolean('Enter key to submit (shouldSubmitOnEnter)', false),
    focusTrap: boolean('Trap focus (focusTrap)', false),
    hasScrollingContent: boolean('Modal contains scrollable content (hasScrollingContent)', false),
    modalHeading: text('Modal heading (modalHeading)', 'Modal heading'),
    modalLabel: text('Optional label (modalLabel)', 'Label'),
    modalAriaLabel: text(
      'ARIA label, used only if modalLabel not provided (modalAriaLabel)',
      'A label to be read by screen readers on the modal root node'
    ),
    primaryButtonText: text('Primary button text (primaryButtonText)', 'Primary Button'),
    secondaryButtonText: text('Secondary button text (secondaryButtonText)', 'Secondary Button'),
    selectorPrimaryFocus: text(
      'Primary focus element selector (selectorPrimaryFocus)',
      '[data-modal-primary-focus]'
    ),
    size: select('Size (size)', sizes),
    iconDescription: text('Close icon description (iconDescription)', 'Close the modal')
  }
});
