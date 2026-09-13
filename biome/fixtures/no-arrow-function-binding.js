const noop = () => {}; // flag
const asyncNoop = async () => {}; // flag
let laterAssigned = (x) => x * 2; // flag
export const exportedArrow = (x) => x + 1; // flag

function handleClick() {}

items.map((item) => item.id);

on_click_binding = {
  handler: (event) => event.preventDefault(),
};

function makeAdder(x) {
  return (y) => x + y;
}
