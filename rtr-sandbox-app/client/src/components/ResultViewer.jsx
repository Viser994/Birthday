function pretty(value) {
  if (value == null) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function ResultViewer({ run }) {
  if (!run) {
    return (
      <div className="empty-state">
        Configure the scenario and press <strong>Run scenario</strong> to see
        request / response details.
      </div>
    );
  }

  if (run.error && !run.steps?.length) {
    return <div className="toast">{run.error}</div>;
  }

  return (
    <div className="results">
      {run.steps?.map((step, index) => {
        const ok = step.result?.ok !== false && (step.result?.status ?? 200) < 400;
        return (
          <article className="step-card" key={`${step.name}-${index}`}>
            <div className="step-head">
              <div>
                <strong>
                  Step {index + 1}: {step.name}
                </strong>
                <div>
                  <span>{step.endpoint}</span>
                </div>
              </div>
              <div className={ok ? "status-ok" : "status-bad"}>
                {step.result?.mode ? `${step.result.mode.toUpperCase()} · ` : ""}
                HTTP {step.result?.status ?? "—"}
              </div>
            </div>
            <div className="step-body">
              <div>
                <div className="code-label request">Request</div>
                <pre className="code-block request">
                  {pretty(step.requestBody ?? step.result?.request?.body ?? null)}
                </pre>
              </div>
              <div>
                <div className="code-label">Response</div>
                <pre className="code-block">{pretty(step.result?.data ?? step.result)}</pre>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
