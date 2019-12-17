import { cx } from '../cx';

test('cx', () => {
  expect(cx(null)).toEqual('');
  expect(cx(undefined)).toEqual('');
  expect(cx('--')).toEqual('bx--');
  expect(cx('--', null)).toEqual('bx--');
  expect(cx(0, undefined, '--', null, 1)).toEqual('bx--');
  expect(cx(1 && '1', 0 && '0')).toEqual('1');
});
