import { withKnobs, select, boolean, text } from '@storybook/addon-knobs';
import Component from './Tag.Story.svelte';
import { TYPES } from './constants';

export default { title: 'Tag', decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    type: select(
      'Tag type (type)',
      Object.keys(TYPES).reduce((items, item) => ({ ...items, [`${item} (${item})`]: item }), {}),
      'red'
    ),
    disabled: boolean('Disabled (disabled)', false),
    slot: text('Content ($$slot)', 'This is not a tag')
  }
});

export const Filter = () => ({
  Component,
  props: {
    story: 'filter',
    filter: true,
    slot: text('Content ($$slot)', 'This is not a tag')
  }
});

export const Skeleton = () => ({ Component, props: { story: 'skeleton' } });
