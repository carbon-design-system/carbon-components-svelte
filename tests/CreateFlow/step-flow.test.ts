import { get } from "svelte/store";
import {
  createStepFlow,
  type StepDefinition,
  type StepFlowOptions,
} from "../../src/CreateFlow/step-flow.js";
import { createUnsavedChanges } from "../../src/UnsavedChanges/unsaved-changes.js";

const steps: StepDefinition[] = [
  { id: "details", label: "Details" },
  { id: "networking", label: "Networking" },
  { id: "storage", label: "Storage", optional: true },
  { id: "review", label: "Review" },
];

const make = (options: StepFlowOptions = {}) =>
  createStepFlow({ steps, ...options });

const ids = (flow: ReturnType<typeof make>) =>
  get(flow).steps.map((step) => step.id);

describe("createStepFlow", () => {
  it("starts on the first step, with the rest not reachable", () => {
    const state = get(make());

    expect(state).toMatchObject({ index: 0, total: 4, first: true });
    expect(state.steps.map((step) => step.reachable)).toEqual([
      true,
      false,
      false,
      false,
    ]);
    expect(state.steps[2]).toMatchObject({
      optional: true,
      secondaryLabel: "Optional",
    });
  });

  it("moves forward through next() and back through back()", async () => {
    const flow = make();

    expect(await flow.next()).toBe(true);
    expect(get(flow)).toMatchObject({ index: 1, first: false });
    expect(get(flow).steps[0]).toMatchObject({ complete: true });
    expect(flow.back()).toBe(true);
    expect(get(flow).index).toBe(0);
    // Back is not a validation, and the step stays complete.
    expect(get(flow).steps[0]).toMatchObject({ complete: true });
    expect(flow.back()).toBe(false);
  });

  it("enters a completed step with goTo(), and not one ahead, in a linear flow", async () => {
    const flow = make();
    await flow.next();
    await flow.next();

    expect(flow.goTo("review")).toBe(false);
    expect(flow.goTo("details")).toBe(true);
    expect(get(flow).current.id).toBe("details");
    // The step the user left is still reachable, up to the first incomplete one.
    expect(flow.goTo("storage")).toBe(true);
    expect(flow.goTo("review")).toBe(false);
  });

  it("enters any step in a non-linear flow", () => {
    const flow = make({ linear: false });

    expect(flow.goTo("review")).toBe(true);
    expect(get(flow).current.id).toBe("review");
  });

  it("never enters a disabled step", () => {
    const flow = make({ linear: false });
    flow.update("networking", { disabled: true });

    expect(flow.goTo("networking")).toBe(false);
  });

  describe("validate", () => {
    it("stays on a step that returns false, and marks it invalid", async () => {
      const flow = make({ validate: () => false });

      expect(await flow.next()).toBe(false);
      expect(get(flow)).toMatchObject({ index: 0, status: "idle" });
      expect(get(flow).steps[0]).toMatchObject({
        invalid: true,
        complete: false,
      });
      expect(get(flow.focus).target).toBe("invalid");
    });

    it("clears invalid once the step passes", async () => {
      let valid = false;
      const flow = make({ validate: () => valid });
      await flow.next();
      valid = true;

      expect(await flow.next()).toBe(true);
      expect(get(flow).steps[0]).toMatchObject({
        invalid: false,
        complete: true,
      });
    });

    it("is busy while an async check runs, and ignores a second next()", async () => {
      let finish: (value: boolean) => void = () => {};
      const validate = vi.fn(
        () => new Promise<boolean>((resolve) => (finish = resolve)),
      );
      const flow = make({ validate });
      const first = flow.next();

      expect(get(flow)).toMatchObject({ status: "validating", busy: true });
      expect(await flow.next()).toBe(false);
      expect(flow.goTo("details")).toBe(false);
      finish(true);
      expect(await first).toBe(true);
      expect(validate).toHaveBeenCalledTimes(1);
      expect(get(flow)).toMatchObject({ index: 1, busy: false });
    });

    it("keeps the error of a check that rejects, and asks for focus on it", async () => {
      const boom = new Error("unreachable");
      const flow = make({ validate: () => Promise.reject(boom) });

      expect(await flow.next()).toBe(false);
      expect(get(flow)).toMatchObject({
        status: "failed",
        error: boom,
        index: 0,
      });
      expect(get(flow).steps[0].invalid).toBe(false);
      expect(get(flow.focus).target).toBe("error");

      flow.clearError();
      expect(get(flow)).toMatchObject({ status: "idle", error: null });
    });

    it("drops the result of a check that finishes after reset()", async () => {
      let finish: (value: boolean) => void = () => {};
      const flow = make({
        validate: () => new Promise<boolean>((resolve) => (finish = resolve)),
      });
      const pending = flow.next();
      flow.reset();
      finish(true);

      expect(await pending).toBe(false);
      expect(get(flow)).toMatchObject({ index: 0, status: "idle" });
      expect(get(flow).steps[0].complete).toBe(false);
    });
  });

  describe("conditional steps", () => {
    it("drops a skipped step from the list, the count and the order", async () => {
      const flow = make();
      flow.update("storage", { skipped: true });

      expect(ids(flow)).toEqual(["details", "networking", "review"]);
      expect(get(flow).total).toBe(3);
      await flow.next();
      await flow.next();
      expect(get(flow).current).toMatchObject({
        id: "review",
        number: 3,
        total: 3,
      });
      expect(get(flow).last).toBe(true);
    });

    it("moves on when the current step is skipped", async () => {
      const flow = make();
      await flow.next();
      await flow.next();
      expect(get(flow).current.id).toBe("storage");

      flow.update("storage", { skipped: true });
      expect(get(flow).current.id).toBe("review");
      flow.update("storage", { skipped: false });
      expect(get(flow).current.id).toBe("review");
    });

    it("keeps a step's state while it is skipped", async () => {
      const flow = make();
      await flow.next();
      flow.update("networking", { skipped: true });
      flow.update("networking", { skipped: false });

      expect(get(flow).steps[0].complete).toBe(true);
      expect(get(flow).steps[1].visited).toBe(true);
    });

    it("does nothing for an id that is not in the flow", () => {
      const flow = make();
      const seen: number[] = [];
      flow.subscribe(() => seen.push(1));
      flow.update("missing", { skipped: true });

      expect(seen).toHaveLength(1);
    });
  });

  describe("submit", () => {
    async function toReview(flow: ReturnType<typeof make>) {
      await flow.next();
      await flow.next();
      await flow.next();
    }

    it("submits on the last step, then marks every step complete", async () => {
      const submit = vi.fn();
      const flow = make({ submit });
      await toReview(flow);

      expect(get(flow).last).toBe(true);
      expect(await flow.next()).toBe(true);
      expect(submit).toHaveBeenCalledTimes(1);
      expect(get(flow)).toMatchObject({ status: "submitted", submitted: true });
      expect(get(flow).steps.every((step) => step.complete)).toBe(true);
      expect(get(flow).steps.some((step) => step.current)).toBe(false);
      expect(get(flow.focus).target).toBe("submitted");
      // Nothing moves once submitted.
      expect(flow.back()).toBe(false);
      expect(await flow.next()).toBe(false);
    });

    it("is submitting while the request runs, and ignores another submit", async () => {
      let finish: () => void = () => {};
      const submit = vi.fn(() => new Promise<void>((r) => (finish = r)));
      const flow = make({ submit });
      await toReview(flow);
      const pending = flow.next();
      await vi.waitFor(() => expect(get(flow).status).toBe("submitting"));

      expect(get(flow).busy).toBe(true);
      expect(await flow.next()).toBe(false);
      finish();
      await pending;
      expect(submit).toHaveBeenCalledTimes(1);
    });

    it("fails with the error, stays on the last step and can be retried", async () => {
      const submit = vi
        .fn()
        .mockRejectedValueOnce(new Error("quota"))
        .mockResolvedValueOnce(undefined);
      const flow = make({ submit });
      await toReview(flow);

      expect(await flow.next()).toBe(false);
      expect(get(flow)).toMatchObject({ status: "failed", index: 3 });
      expect((get(flow).error as Error).message).toBe("quota");
      expect(get(flow.focus).target).toBe("error");

      expect(await flow.next()).toBe(true);
      expect(get(flow)).toMatchObject({ status: "submitted", error: null });
    });

    it("clears the unsaved-changes store when the submit succeeds, and not when it fails", async () => {
      const unsavedChanges = createUnsavedChanges();
      unsavedChanges.set("form", true);
      const submit = vi
        .fn()
        .mockRejectedValueOnce(new Error("no"))
        .mockResolvedValueOnce(undefined);
      const flow = make({ submit, unsavedChanges });
      await toReview(flow);

      await flow.next();
      expect(get(unsavedChanges.dirty)).toBe(true);
      await flow.next();
      expect(get(unsavedChanges.dirty)).toBe(false);
    });

    it("checks a step never completed before submitting, and shows the first that fails", async () => {
      const submit = vi.fn();
      const validate = vi.fn(
        (step: { id: string }) => step.id !== "networking",
      );
      const flow = make({ linear: false, submit, validate });
      flow.goTo("review");

      expect(await flow.next()).toBe(false);
      expect(submit).not.toHaveBeenCalled();
      expect(get(flow).current.id).toBe("networking");
      expect(get(flow).steps[1].invalid).toBe(true);
      expect(validate.mock.calls.map(([step]) => step.id)).toEqual([
        "review",
        "details",
        "networking",
      ]);
    });
  });

  it("starts from the first step again on reset(), without asking for focus", async () => {
    const flow = make();
    await flow.next();
    const { count } = get(flow.focus);
    flow.reset();

    expect(get(flow)).toMatchObject({ index: 0, status: "idle" });
    expect(get(flow).steps.some((step) => step.complete)).toBe(false);
    expect(get(flow.focus).count).toBe(count);
  });

  it("asks for focus on the step after a step change, once per change", async () => {
    const flow = make();
    const targets: Array<string | null> = [];
    flow.focus.subscribe((request) => targets.push(request.target));
    await flow.next();
    flow.back();

    expect(targets).toEqual([null, "step", "step"]);
  });
});
