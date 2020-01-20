import { render } from '@testing-library/svelte';
import Component from './InlineLoading.svelte';

test('InlineLoading', () => {
  const { container, rerender } = render(Component, {
    description: 'description',
    iconDescription: 'icon description'
  });

  expect(container.querySelector('.bx--inline-loading')).toHaveTextContent('description');
  expect(container.querySelector('.bx--loading')).toBeInTheDocument();

  rerender({ props: { status: 'error' } });
  expect(container.querySelector('.bx--inline-loading--error')).toBeInTheDocument();

  rerender({ props: { status: 'finished' } });
  expect(container.querySelector('.bx--inline-loading__checkmark-container')).toBeInTheDocument();
});
