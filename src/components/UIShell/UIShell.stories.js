import { withKnobs, text } from '@storybook/addon-knobs';
import Component from './UIShell.Story.svelte';

export default { title: 'UIShell', decorators: [withKnobs] };

export const Header = () => ({
  Component,
  props: {
    story: 'header',
    href: text('The link href (href)', '#'),
    company: text('Company name', 'IBM'),
    platformName: text('Platform name', 'Platform Name')
  }
});

export const Sidenav = () => ({
  Component,
  props: {
    story: 'sidenav',
    href: text('The link href (href)', '#'),
    company: text('Company name', 'IBM'),
    platformName: text('Platform name', 'Platform Name')
  }
});

export const HeaderWithNav = () => ({
  Component,
  props: {
    story: 'header-with-nav',
    href: text('The link href (href)', '#'),
    company: text('Company name', 'IBM'),
    platformName: text('Platform name', 'Platform Name')
  }
});

export const HeaderWithUtilities = () => ({
  Component,
  props: {
    story: 'header-with-utilities',
    href: text('The link href (href)', '#'),
    company: text('Company name', 'IBM'),
    platformName: text('Platform name', 'Platform Name')
  }
});

export const HeaderWithSwitcher = () => ({
  Component,
  props: {
    story: 'header-with-switcher',
    href: text('The link href (href)', '#'),
    company: text('Company name', 'IBM'),
    platformName: text('Platform name', 'Platform Name')
  }
});

export const HeaderAndSidenav = () => ({
  Component,
  props: {
    story: 'header-and-sidenav',
    href: text('The link href (href)', '#'),
    company: text('Company name', 'IBM'),
    platformName: text('Platform name', 'Platform Name')
  }
});
