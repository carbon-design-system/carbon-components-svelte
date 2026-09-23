import type { Readable } from "svelte/store";

export type Command = {
  do(): void;
  undo(): void;
  /** Consecutive commands with the same key fold into one undo step. */
  key?: string;
  label?: string;
};

export type CommandStack = {
  canUndo: Readable<boolean>;
  canRedo: Readable<boolean>;
  /** Run the command and remember it. Clears anything undone. */
  execute(command: Command): void;
  undo(): boolean;
  redo(): boolean;
  clear(): void;
  /** End the current coalescing group. */
  seal(): void;
};

export function createCommandStack(options?: { limit?: number }): CommandStack;
