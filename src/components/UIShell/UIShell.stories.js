import { withKnobs, text } from '@storybook/addon-knobs';
import Component from './UIShell.Story.svelte';

export default { title: 'UIShell', decorators: [withKnobs] };

export const WithNav = () => ({
  Component,
  props: {
    story: 'with-nav',
    href: text('The link href (href)', '#'),
    company: text('Company name', 'IBM'),
    platformName: text('Platform name', 'Platform Name')
  }
});

export const WithActions = () => ({
  Component,
  props: {
    story: 'with-actions',
    href: text('The link href (href)', '#'),
    company: text('Company name', 'IBM'),
    platformName: text('Platform name', 'Platform Name')
  }
});

export const WithActionsAndSidenav = () => ({
  Component,
  props: {
    story: 'with-sidenav',
    href: text('The link href (href)', '#'),
    company: text('Company name', 'IBM'),
    platformName: text('Platform name', 'Platform Name')
  }
});
