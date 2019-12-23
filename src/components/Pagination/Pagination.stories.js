import { withKnobs, text, number, boolean, array } from '@storybook/addon-knobs';
import Component from './Pagination.Story.svelte';

export default { title: 'Pagination', decorators: [withKnobs] };

export const Default = () => ({
  Component,
  props: {
    disabled: boolean('Disable backward/forward buttons (disabled)', false),
    page: number('The current page (page)', 1),
    totalItems: number('Total number of items (totalItems)', 103),
    pagesUnknown: boolean('Total number of items unknown (pagesUnknown)', false),
    pageInputDisabled: boolean('Disable page input (pageInputDisabled)', false),
    backwardText: text('The description for the backward icon (backwardText)', 'Previous page'),
    forwardText: text('The description for the forward icon (forwardText)', 'Next page'),
    pageSize: number('Number of items per page (pageSize)', 10),
    pageSizes: array('Choices of `pageSize` (pageSizes)', [10, 20, 30, 40, 50]),
    itemsPerPageText: text('Label for `pageSizes` select UI (itemsPerPageText)', 'Items per page:')
  }
});

export const Multiple = () => ({
  Component,
  props: {
    story: 'multiple',
    disabled: boolean('Disable backward/forward buttons (disabled)', false),
    page: number('The current page (page)', 1),
    totalItems: number('Total number of items (totalItems)', 103),
    pagesUnknown: boolean('Total number of items unknown (pagesUnknown)', false),
    pageInputDisabled: boolean('Disable page input (pageInputDisabled)', false),
    backwardText: text('The description for the backward icon (backwardText)', 'Previous page'),
    forwardText: text('The description for the forward icon (forwardText)', 'Next page'),
    pageSize: number('Number of items per page (pageSize)', 10),
    pageSizes: array('Choices of `pageSize` (pageSizes)', [10, 20, 30, 40, 50]),
    itemsPerPageText: text('Label for `pageSizes` select UI (itemsPerPageText)', 'Items per page:')
  }
});

export const Skeleton = () => ({ Component, props: { story: 'skeleton' } });
