import { GUIDED_STEPS } from "../lib/sessionStore.js";

export default function GuidedTour({
  completedIds = [],
  running = false,
  currentStepId = "",
  onStart,
  onJump,
}) {
  const doneCount = GUIDED_STEPS.filter((s) =>
    completedIds.includes(s.id)
  ).length;
  const progress = Math.round((doneCount / GUIDED_STEPS.length) * 100);

  return (
    <section className="panel guided-tour">
      <div className="guided-head">
        <div>
          <h2>Guided happy path</h2>
          <p>
            Walk through the most common RTR flow in order — token, heartbeat,
            send payment, then status enquiry.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onStart}
          disabled={running}
        >
          {running ? "Running tour…" : "Run guided tour"}
        </button>
      </div>

      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="progress-label">
        {doneCount} of {GUIDED_STEPS.length} steps completed
      </div>

      <ol className="guided-steps">
        {GUIDED_STEPS.map((step, index) => {
          const done = completedIds.includes(step.id);
          const current = currentStepId === step.id;
          return (
            <li
              key={step.id}
              className={`guided-step${done ? " done" : ""}${current ? " current" : ""}`}
            >
              <button type="button" onClick={() => onJump(step.id)}>
                <span className="step-index">{done ? "✓" : index + 1}</span>
                <span>
                  <strong>{step.title}</strong>
                  <small>{step.description}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
