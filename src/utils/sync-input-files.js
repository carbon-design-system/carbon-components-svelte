// @ts-check

/**
 * Make a native file input hold exactly `files`, so native form
 * submission posts what the component shows. Clears the input when
 * `files` is empty. Fails open when the `DataTransfer` constructor is
 * unavailable.
 *
 * @param {HTMLInputElement} input
 * @param {ReadonlyArray<File>} files
 */
export function syncInputFiles(input, files) {
  if (files.length === 0) input.value = "";
  try {
    const dataTransfer = new DataTransfer();
    for (const file of files) dataTransfer.items.add(file);
    input.files = dataTransfer.files;
  } catch {
    // Fail open if DataTransfer API is not supported.
  }
}
