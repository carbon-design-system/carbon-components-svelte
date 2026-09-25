/**
 * Makes a native file input hold exactly `files`; clears it when empty.
 */
export function syncInputFiles(
  input: HTMLInputElement,
  files: ReadonlyArray<File>,
): void;
