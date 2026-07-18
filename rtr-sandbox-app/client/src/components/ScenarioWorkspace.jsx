import { useEffect, useMemo, useState } from "react";
import ResultViewer from "./ResultViewer.jsx";
import { runScenario } from "../lib/api.js";

function defaultsFromFields(fields = []) {
  return Object.fromEntries(fields.map((f) => [f.key, f.default ?? ""]));
}

export default function ScenarioWorkspace({ scenario, mode }) {
  const [form, setForm] = useState(() => defaultsFromFields(scenario?.formFields));
  const [loading, setLoading] = useState(false);
  const [run, setRun] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(defaultsFromFields(scenario?.formFields));
    setRun(null);
    setError("");
  }, [scenario?.id]);

  const canRun = Boolean(scenario);

  const expected = useMemo(
    () => scenario?.expectedOutcome || "",
    [scenario]
  );

  async function onRun() {
    if (!scenario) return;
    setLoading(true);
    setError("");
    try {
      const result = await runScenario(scenario.id, form);
      setRun(result);
    } catch (err) {
      setError(err.message || "Scenario failed");
      setRun(null);
    } finally {
      setLoading(false);
    }
  }

  function onReset() {
    setForm(defaultsFromFields(scenario?.formFields));
    setRun(null);
    setError("");
  }

  if (!scenario) {
    return (
      <section className="panel workspace">
        <div className="empty-state">Select a scenario from the left.</div>
      </section>
    );
  }

  return (
    <section className="panel workspace">
      <div className="workspace-header">
        <div>
          <h2>{scenario.title}</h2>
          <p>{scenario.description}</p>
        </div>
      </div>

      <div className="meta-row">
        <span className="chip">{scenario.iso}</span>
        <span className="chip amber">{scenario.endpoint}</span>
        <span className="chip">{scenario.group}</span>
      </div>

      {mode === "demo" && (
        <p className="hint">
          Running in demo mode with stubbed ISO 20022-shaped responses. Add your
          Developer Portal <code>CONSUMER_KEY</code> / <code>CONSUMER_SECRET</code>{" "}
          to <code>.env</code> and restart for live sandbox calls.
        </p>
      )}

      <p className="hint" style={{ background: "rgba(31,122,92,0.1)", color: "#0f4f3c" }}>
        Expected outcome: {expected}
      </p>

      {scenario.formFields?.length > 0 && (
        <div className="form-grid">
          {scenario.formFields.map((field) => (
            <div className="field" key={field.key}>
              <label htmlFor={field.key}>{field.label}</label>
              <input
                id={field.key}
                type={field.type || "text"}
                value={form[field.key] ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
      )}

      <div className="actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canRun || loading}
          onClick={onRun}
        >
          {loading ? "Running…" : "Run scenario"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onReset} disabled={loading}>
          Reset
        </button>
      </div>

      {error && <div className="toast">{error}</div>}
      <ResultViewer run={run} />
    </section>
  );
}
