/** Simulates a user picking `files` through a file `<input>`'s native dialog. */
export function simulateFileSelection(input: HTMLInputElement, files: File[]) {
  const dataTransfer = new DataTransfer();
  for (const file of files) {
    dataTransfer.items.add(file);
  }

  Object.defineProperty(input, "files", {
    value: dataTransfer.files,
    writable: true,
    configurable: true,
  });

  input.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Returns the names of the files currently held by a file `<input>`. */
export function fileNames(input: HTMLInputElement) {
  assert(input.files);
  return Array.from(input.files, (file) => file.name);
}
