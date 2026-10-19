import { screen } from "@testing-library/svelte";

const REMOVE_FILE = /remove file/i;

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

/** Returns the `<input type="file">` inside `root`. */
export function getFileInput(root: ParentNode) {
  const input = root.querySelector('input[type="file"]');
  assert(input instanceof HTMLInputElement);
  return input;
}

/** Returns the `<input type="file">` a component exposes through `bind:ref`. */
export function getRefInput(component: { ref: unknown }) {
  assert(component.ref instanceof HTMLInputElement);
  return component.ref;
}

/** Empties a file `<input>`'s `files`, as opening the native picker does. */
export function emptyFileInput(input: HTMLInputElement) {
  Object.defineProperty(input, "files", {
    value: new DataTransfer().files,
    writable: true,
    configurable: true,
  });
}

/** Picks `files` through the component's `bind:ref` input, waits for every name to render, and returns the input. */
export async function selectFiles(component: { ref: unknown }, files: File[]) {
  const input = getRefInput(component);
  simulateFileSelection(input, files);
  await vi.waitFor(() => {
    for (const { name } of files) {
      expect(screen.queryByText(name)).toBeInTheDocument();
    }
  });
  return input;
}

/** Returns every row's remove button, in row order. */
export function removeButtons() {
  return screen.getAllByRole("button", { name: REMOVE_FILE });
}

/** Builds a `text/plain` file of `size` bytes; `init` overrides `type` or `lastModified`. */
export function makeFile(name: string, size = 10, init: FilePropertyBag = {}) {
  return new File(["x".repeat(size)], name, { type: "text/plain", ...init });
}

/** Builds a `dragover`, `dragleave` or `drop` event carrying `files`. */
export function createDragEvent(
  type: "dragover" | "dragleave" | "drop",
  files: File[] = [],
  relatedTarget: EventTarget | null = null,
) {
  const dataTransfer = new DataTransfer();
  for (const file of files) {
    dataTransfer.items.add(file);
  }

  // Create a mock DragEvent since it may not be available in test environment
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  }) as DragEvent;

  Object.defineProperty(event, "dataTransfer", {
    value: dataTransfer,
    writable: false,
    configurable: true,
  });

  Object.defineProperty(event, "relatedTarget", {
    value: relatedTarget,
    writable: false,
    configurable: true,
  });

  return event;
}

/** Returns the `.bx--file` element that receives drag events. */
export function getDropZone(container: HTMLElement) {
  const dropZone = container.querySelector(".bx--file");
  assert(dropZone instanceof HTMLElement);
  return dropZone;
}

/** Drops `files` on the drop zone and returns the dispatched event. */
export function dropFiles(container: HTMLElement, files: File[]) {
  const event = createDragEvent("drop", files);
  getDropZone(container).dispatchEvent(event);
  return event;
}
