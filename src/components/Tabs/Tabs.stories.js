import { withKnobs, boolean, number, text } from '@storybook/addon-knobs';
import Component from './Tabs.Story.svelte';

export default { title: 'Tabs', decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    tabProps: {
      disabled: boolean('Disabled (disabled in <Tab>)', false),
      href: text('The href for tab (href in <Tab>)', '#'),
      role: text('ARIA role (role in <Tab>)', 'presentation'),
      tabindex: text('Tab index (tabindex in <Tab>)', '0')
    },
    tabsProps: {
      className: 'some-class',
      selected: number('The index of the selected tab (selected in <Tabs>)', 1),
      triggerHref: text('The href of trigger button for narrow mode (triggerHref in <Tabs>)', '#'),
      role: text('ARIA role (role in <Tabs>)', 'navigation'),
      iconDescription: text(
        'The description of the trigger icon for narrow mode (iconDescription in <Tabs>)',
        'show menu options'
      ),
      tabContentClassName: text(
        'The className for the child `<TabContent>` components',
        'tab-content'
      )
    }
  }
});

export const Container = () => ({
  Component,
  props: {
    story: 'container',
    tabProps: {
      disabled: boolean('Disabled (disabled in <Tab>)', false),
      href: text('The href for tab (href in <Tab>)', '#'),
      role: text('ARIA role (role in <Tab>)', 'presentation'),
      tabindex: text('Tab index (tabindex in <Tab>)', '0')
    }
  }
});

export const Skeleton = () => ({ Component, props: { story: 'skeleton' } });
