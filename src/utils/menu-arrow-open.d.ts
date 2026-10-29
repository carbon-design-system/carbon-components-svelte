/**
 * Let ArrowDown and ArrowUp on a closed menu's trigger open it, as the APG
 * menu button pattern allows. `open` is called with the key and returns
 * whether it opened the menu; the key's default is prevented only then.
 */
export function listenMenuArrowOpen(
  trigger: HTMLElement | null,
  open: (key: "ArrowDown" | "ArrowUp") => boolean,
): () => void;
