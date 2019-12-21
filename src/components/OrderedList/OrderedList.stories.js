import { withKnobs } from '@storybook/addon-knobs';
import Component from './OrderedList.Story.svelte';

export default { title: 'OrderedList', decorators: [withKnobs] };

export const Default = () => ({ Component });

export const Nested = () => ({ Component, props: { story: 'nested' } });
