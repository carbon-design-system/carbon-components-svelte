let isCopyError = false; // flag
let hasBeenSelected = false; // flag
let shouldFilter = true; // flag

const hasPrimaryItems = writable(false);
function isOutsideClick() {
  return true;
}
let open = false;
let focused = false;
