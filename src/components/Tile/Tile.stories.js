import { withKnobs, number, boolean, text } from '@storybook/addon-knobs';
import Component from './Tile.Story.svelte';

export default { title: 'Tile', decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: { light: boolean('Light variant (light)', false) }
});

export const Clickable = () => ({
  Component,
  props: {
    story: 'clickable',
    href: text('Href for clickable UI (href)', 'javascript:void(0)'),
    light: boolean('Light variant (light)', false)
  }
});

export const MultiSelect = () => ({
  Component,
  props: {
    story: 'multi-select',
    selected: boolean('Selected (selected)', false),
    light: boolean('Light variant (light)', false)
  }
});

MultiSelect.story = { name: 'Multi-select' };

export const Selectable = () => ({
  Component,
  props: {
    story: 'selectable',
    name: text('Form item name (name in <RadioTile>)', 'tiles'),
    light: boolean('Light variant (light)', false)
  }
});

export const Expandable = () => ({
  Component,
  props: {
    story: 'expandable',
    tabindex: text('Tab index (tabindex)', '0'),
    expanded: boolean('Expanded (expanded)', false),
    tileMaxHeight: number('Max height (tileMaxHeight)', 0),
    tileCollapsedIconText: text(
      'Collapsed icon text (tileCollapsedIconText)',
      'Interact to Expand tile'
    ),
    tileExpandedIconText: text(
      'Collapsed icon text (tileExpandedIconText)',
      'Interact to Collapse tile'
    ),
    light: boolean('Light variant (light)', false)
  }
});
