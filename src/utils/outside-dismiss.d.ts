export type OutsideDismiss = {
  pressInside: () => void;
  pressOutside: () => void;
  release: () => void;
};

export function createOutsideDismiss(onDismiss: () => void): OutsideDismiss;
