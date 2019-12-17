import { fireEvent, render } from '@testing-library/svelte';
import Component from './Breadcrumb.Story.svelte';

describe('Breadcrumb', () => {
  function getLastBreadcrumbItem(container) {
    const breadcrumbItems = container.querySelectorAll('.bx--breadcrumb-item');
    return breadcrumbItems[breadcrumbItems.length - 1];
  }

  test('default', () => {
    const { getByText, container, rerender } = render(Component, { noTrailingSlash: false });
    const selector = '.bx--breadcrumb--no-trailing-slash';
    expect(getByText('Breadcrumb 1')).toBeInTheDocument();
    expect(getByText('Breadcrumb 2')).toBeInTheDocument();
    expect(getByText('Breadcrumb 3')).toBeInTheDocument();
    expect(container.querySelector(selector)).not.toBeInTheDocument();
    expect(container.innerHTML).toMatchSnapshot();

    rerender({ props: { noTrailingSlash: true } });
    expect(container.querySelector(selector)).toBeInTheDocument();
    expect(container.innerHTML).toMatchSnapshot();
  });

  test('skeleton', () => {
    const { container } = render(Component, { story: 'skeleton' });
    expect(container.innerHTML).toMatchSnapshot();
  });

  test('current page', () => {
    const { container } = render(Component, { story: 'current page' });
    const lastItem = getLastBreadcrumbItem(container);
    expect(lastItem.classList.contains('bx--breadcrumb-item--current')).toEqual(true);
  });

  test('current page with aria-current', () => {
    const { container } = render(Component, { story: 'current page with aria-current' });
    const lastItem = getLastBreadcrumbItem(container);
    expect(lastItem.querySelector('[aria-current="page"]')).toBeTruthy();
  });
});
