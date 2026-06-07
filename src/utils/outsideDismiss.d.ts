export type OutsideDismiss = {
  pressInside: () => void;
  release: () => void;
};

export function createOutsideDismiss(onDismiss: () => void): OutsideDismiss;
