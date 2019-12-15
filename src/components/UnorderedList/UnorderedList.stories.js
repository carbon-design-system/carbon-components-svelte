import { withKnobs } from '@storybook/addon-knobs';
import Component from './UnorderedList.Story.svelte';

export default { title: 'Unordered List', decorators: [withKnobs] };

export const Default = () => ({ Component });

export const Nested = () => ({ Component, props: { story: 'nested' } });
