interface TruncateOptions {
  clamp?: "end" | "front";
}

export function TruncateAction(
  node: HTMLElement,
  options?: TruncateOptions
): {
  update: (options?: TruncateOptions) => void;
};

export default TruncateAction;
