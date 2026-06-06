export type CopyFeedbackAnimation = "fade-in" | "fade-out" | undefined;

export type CopyFeedbackState = {
  readonly animation: CopyFeedbackAnimation;
  readonly feedbackOpen: boolean;
  readonly copyPending: boolean;
  dismiss: () => void;
  onClick: (
    performCopy: () => void | Promise<void>,
    feedbackTimeout: number,
    portalled?: boolean,
  ) => Promise<void>;
  onAnimationEnd: (event: { animationName: string }) => void;
  cleanup: () => void;
};

export function createCopyFeedbackState(onSync?: () => void): CopyFeedbackState;
