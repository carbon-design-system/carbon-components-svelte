interface TruncateOptions {
  clamp?: "end" | "front";
}

export function truncate(
  node: HTMLElement,
  options?: TruncateOptions,
): {
  update: (options?: TruncateOptions) => void;
};

export default truncate;
