/** Mark a `pointerdown` as taken by the element that started a drag with it. */
export function claimPointer(event: Event): void;

/** Whether an element in the event's path has claimed it. */
export function isPointerClaimed(event: Event): boolean;
