export type CopyFeedbackAnimation = "fade-in" | "fade-out" | undefined;

export type CopyFeedbackState = {
  readonly animation: CopyFeedbackAnimation;
  readonly feedbackOpen: boolean;
  readonly copyPending: boolean;
  readonly timeout: ReturnType<typeof setTimeout> | undefined;
  dismiss: () => void;
  onClick: (
    performCopy: () => void | Promise<void>,
    feedbackTimeout: number,
  ) => Promise<void>;
  onAnimationEnd: (event: { animationName: string }) => void;
  cleanup: () => void;
};

export function createCopyFeedbackState(onSync?: () => void): CopyFeedbackState;
