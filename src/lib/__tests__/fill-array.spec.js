import { fillArray } from '../fill-array';

test('fillArray', () => {
  expect(fillArray(0)).toEqual([]);
  expect(fillArray(2)).toEqual([0, 1]);
  expect(fillArray(3)).toEqual([0, 1, 2]);
});
