import { withKnobs, text } from '@storybook/addon-knobs';
import Component from './UIShell.Story.svelte';

export default { title: 'UIShell', decorators: [withKnobs] };

export const Base = () => ({
  Component,
  props: {
    story: 'base',
    href: text('The link href (href)', '#'),
    company: text('Company name', 'IBM'),
    platformName: text('Platform name', 'Platform Name')
  }
});

export const WithHeaderAndNav = () => ({
  Component,
  props: {
    story: 'with-header-and-nav',
    href: text('The link href (href)', '#'),
    company: text('Company name', 'IBM'),
    platformName: text('Platform name', 'Platform Name')
  }
});

export const WithUtilities = () => ({
  Component,
  props: {
    story: 'with-utilities',
    href: text('The link href (href)', '#'),
    company: text('Company name', 'IBM'),
    platformName: text('Platform name', 'Platform Name')
  }
});

export const WithSwitcher = () => ({
  Component,
  props: {
    story: 'with-switcher',
    href: text('The link href (href)', '#'),
    company: text('Company name', 'IBM'),
    platformName: text('Platform name', 'Platform Name')
  }
});

export const WithSidenav = () => ({
  Component,
  props: {
    story: 'with-sidenav',
    href: text('The link href (href)', '#'),
    company: text('Company name', 'IBM'),
    platformName: text('Platform name', 'Platform Name')
  }
});
