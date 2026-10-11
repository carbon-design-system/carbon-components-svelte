export type FrameStage = (carry: never) => unknown;

export type FrameJob = {
  /** Run the stages in the next frame. Scheduling again before then changes nothing. */
  schedule: () => void;
  /** Drop a scheduled job, including from inside a running frame's stages. */
  cancel: () => void;
};

/**
 * Create a job whose stages run in the next animation frame, stage by stage
 * together with every other scheduled job's. Each stage receives what the
 * previous stage returned. Put reads in one stage and writes in the next, and
 * N jobs force one layout between them instead of N.
 */
export function createFrameJob(stages: ReadonlyArray<FrameStage>): FrameJob;
