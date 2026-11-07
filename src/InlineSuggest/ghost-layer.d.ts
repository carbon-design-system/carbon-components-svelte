export function placeGhostLayer(
  field: HTMLInputElement | HTMLTextAreaElement,
  frame: HTMLElement,
  layer: HTMLElement,
): { multiline: boolean; rtl: boolean };
export function followScroll(
  field: HTMLInputElement | HTMLTextAreaElement,
  layer: HTMLElement,
): boolean;
export function ghostShiftsTyped(typedNode: Node, ghostNode: Node): boolean;
export function paintGhost(
  typedNode: Node,
  ghostNode: Node,
  typed: string,
  ghost: string,
): void;
