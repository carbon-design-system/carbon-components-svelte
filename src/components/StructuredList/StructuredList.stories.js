import { withKnobs } from '@storybook/addon-knobs';
import Component from './StructuredList.Story.svelte';

export default { title: 'StructuredList', decorators: [withKnobs] };

export const Default = () => ({ Component });

export const Selection = () => ({ Component, props: { story: 'selection' } });

export const Skeleton = () => ({ Component, props: { story: 'skeleton' } });
