import { useState } from "react";
import ResponseSummary from "./ResponseSummary.jsx";
import { readStep } from "../lib/responseReader.js";

function pretty(value) {
  if (value == null) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function RawToggle({ label, value, variant = "response" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`raw-panel ${variant}`}>
      <button
        type="button"
        className="raw-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{open ? "Hide" : "Show"} raw {label}</span>
        <span className="raw-chevron">{open ? "▾" : "▸"}</span>
      </button>
      {open && <pre className={`code-block ${variant === "request" ? "request" : ""}`}>{pretty(value)}</pre>}
    </div>
  );
}

export default function ResultViewer({ run }) {
  if (!run) {
    return (
      <div className="empty-state">
        Configure the scenario and press <strong>Run scenario</strong> to see a
        readable summary of the request and response.
      </div>
    );
  }

  if (run.error && !run.steps?.length) {
    return <div className="toast">{run.error}</div>;
  }

  return (
    <div className="results">
      <div className="results-intro">
        <h3>Readable results</h3>
        <p>
          ISO 20022 payloads are decoded into plain-language status, IDs, and
          balances. Expand raw JSON if you need the full message.
        </p>
      </div>

      {run.steps?.map((step, index) => {
        const parsed = readStep(step);
        return (
          <article className="step-card friendly" key={`${step.name}-${index}`}>
            <div className="step-head">
              <div>
                <strong>
                  Step {index + 1}: {step.name}
                </strong>
                <div>
                  <span>{step.endpoint}</span>
                </div>
              </div>
              <div className={parsed.httpOk ? "status-ok" : "status-bad"}>
                {parsed.mode ? `${parsed.mode.toUpperCase()} · ` : ""}
                HTTP {parsed.status ?? "—"}
              </div>
            </div>

            <div className="friendly-grid">
              {parsed.requestView && (
                <ResponseSummary view={parsed.requestView} title="What we sent" />
              )}
              <ResponseSummary
                view={parsed.responseView}
                title="What came back"
              />
            </div>

            <div className="raw-row">
              <RawToggle
                label="request JSON"
                variant="request"
                value={step.requestBody ?? step.result?.request?.body ?? null}
              />
              <RawToggle
                label="response JSON"
                variant="response"
                value={step.result?.data ?? step.result}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
