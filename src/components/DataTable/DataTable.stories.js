import { withKnobs, boolean, select, text } from '@storybook/addon-knobs';
import Component from './DataTable.Story.svelte';

export default { title: 'DataTable', decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    title: text('Optional DataTable title (title)', ''),
    description: text('Optional DataTable description (description)', ''),
    zebra: boolean('Zebra row styles (zebra)', false),
    size: select(
      'Row height (size)',
      { compact: 'compact', short: 'short', tall: 'tall', none: null },
      null
    ),
    stickyHeader: boolean('Sticky header (experimental)', false)
  }
});

export const Sortable = () => ({
  Component,
  props: {
    story: 'sortable',
    title: text('Optional DataTable title (title)', ''),
    description: text('Optional DataTable description (description)', ''),
    zebra: boolean('Zebra row styles (zebra)', false),
    size: select(
      'Row height (size)',
      { compact: 'compact', short: 'short', tall: 'tall', none: null },
      null
    ),
    stickyHeader: boolean('Sticky header (experimental)', false)
  }
});
