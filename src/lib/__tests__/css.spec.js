import { css } from '../css';

test('css', () => {
  expect(css([])).toEqual('');
  expect(css(['width: 20px; height: 20px;'])).toEqual('width: 20px; height: 20px');
  expect(css(['width: 20px;', ['height', '20px']])).toEqual('width: 20px; height: 20px');
  expect(css(['width: 20px', ['height', '20px']])).toEqual('width: 20px; height: 20px');
  expect(css([undefined, null, 0, ['height', '20px']])).toEqual('height: 20px');
});
