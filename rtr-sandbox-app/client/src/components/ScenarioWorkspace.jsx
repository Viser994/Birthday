import { useEffect, useMemo, useState } from "react";
import ResultViewer from "./ResultViewer.jsx";
import { runScenario } from "../lib/api.js";

function defaultsFromFields(fields = [], paymentContext = null) {
  const base = Object.fromEntries(fields.map((f) => [f.key, f.default ?? ""]));
  if (!paymentContext) return base;

  return {
    ...base,
    ...(paymentContext.fromMember ? { fromMember: paymentContext.fromMember } : {}),
    ...(paymentContext.toMember ? { toMember: paymentContext.toMember } : {}),
    ...(paymentContext.messageId
      ? { originalMessageId: paymentContext.messageId }
      : {}),
    ...(paymentContext.endToEndId
      ? { originalEndToEndId: paymentContext.endToEndId }
      : {}),
    ...(paymentContext.uetr ? { originalUetr: paymentContext.uetr } : {}),
  };
}

function nextStepFor(scenarioId) {
  const map = {
    "auth-token": {
      id: "heartbeat",
      label: "Next: run heartbeat",
      tip: "Confirm Exchange is reachable before sending payments.",
    },
    heartbeat: {
      id: "send-payment",
      label: "Next: send a payment",
      tip: "Submit a pacs.008 credit transfer.",
    },
    "send-payment": {
      id: "payment-status",
      label: "Next: check payment status",
      tip: "We’ll pre-fill UETR and message IDs from the payment you just sent.",
    },
    "payment-status": {
      id: "interest-report",
      label: "Explore reports",
      tip: "Try interest or balance reports from Clearing & Settlement.",
    },
    "e2e-payment-flow": {
      id: "payment-status",
      label: "Re-check status",
      tip: "Status enquiry fields are filled from the latest payment.",
    },
  };
  return map[scenarioId] || null;
}

export default function ScenarioWorkspace({
  scenario,
  mode,
  productOk = true,
  productWarning = "",
  paymentContext = null,
  externalRun = null,
  onRunComplete,
  onNavigate,
}) {
  const [form, setForm] = useState(() =>
    defaultsFromFields(scenario?.formFields, paymentContext)
  );
  const [loading, setLoading] = useState(false);
  const [run, setRun] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setForm(defaultsFromFields(scenario?.formFields, paymentContext));
    setRun(null);
    setError("");
    setToast(null);
  }, [scenario?.id]);

  useEffect(() => {
    if (!scenario) return;
    // Keep status enquiry fields synced when a new payment is captured.
    if (scenario.id === "payment-status" && paymentContext) {
      setForm((prev) => ({
        ...prev,
        ...defaultsFromFields(scenario.formFields, paymentContext),
      }));
    }
  }, [paymentContext, scenario]);

  useEffect(() => {
    if (externalRun && externalRun.scenarioId === scenario?.id) {
      setRun(externalRun);
    }
  }, [externalRun, scenario?.id]);

  const canRun = Boolean(scenario);
  const expected = useMemo(() => scenario?.expectedOutcome || "", [scenario]);
  const next = useMemo(
    () => (scenario ? nextStepFor(scenario.id) : null),
    [scenario]
  );

  async function onRun() {
    if (!scenario) return;
    setLoading(true);
    setError("");
    setToast(null);
    try {
      const result = await runScenario(scenario.id, form);
      setRun(result);
      const summary = onRunComplete?.(result);
      const ok = summary?.ok !== false;
      setToast({
        tone: ok ? "success" : "error",
        text: ok
          ? `Done — ${summary?.status || "success"} (HTTP ${summary?.http ?? "—"})`
          : `Finished with issues — ${summary?.status || "error"} (HTTP ${summary?.http ?? "—"})`,
      });
    } catch (err) {
      setError(err.message || "Scenario failed");
      setRun(null);
      setToast({ tone: "error", text: err.message || "Scenario failed" });
    } finally {
      setLoading(false);
    }
  }

  function onReset() {
    setForm(defaultsFromFields(scenario?.formFields, paymentContext));
    setRun(null);
    setError("");
    setToast(null);
  }

  function applyLastPayment() {
    if (!paymentContext) return;
    setForm((prev) => ({
      ...prev,
      ...defaultsFromFields(scenario?.formFields || [], paymentContext),
    }));
    setToast({
      tone: "success",
      text: "Filled fields from the latest payment in this session.",
    });
  }

  if (!scenario) {
    return (
      <section className="panel workspace">
        <div className="empty-state">Select a scenario from the left.</div>
      </section>
    );
  }

  const showPaymentPrefill =
    scenario.id === "payment-status" && Boolean(paymentContext);

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
          Running in demo mode with stubbed ISO 20022-shaped responses. Paste
          Consumer Key / Secret above (product must be{" "}
          <code>rtr-sandbox-product</code>) for live sandbox calls.
        </p>
      )}

      {mode === "live" && !productOk && (
        <p className="toast">
          {productWarning ||
            "Credentials authenticate, but the app product is not RTR sandbox. RTR scenario calls will return 401 until you use an rtr-sandbox-product app."}
        </p>
      )}

      <p
        className="hint"
        style={{ background: "rgba(31,122,92,0.1)", color: "#0f4f3c" }}
      >
        Expected outcome: {expected}
      </p>

      {showPaymentPrefill && (
        <div className="next-step-banner">
          <div>
            <strong>Using your latest payment</strong>
            <p>
              UETR and message IDs are filled from{" "}
              <code>{paymentContext.uetr || paymentContext.endToEndId}</code>
            </p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={applyLastPayment}>
            Refresh from latest
          </button>
        </div>
      )}

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
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onReset}
          disabled={loading}
        >
          Reset
        </button>
        {next && (
          <button
            type="button"
            className="btn btn-ghost"
            disabled={loading}
            onClick={() => onNavigate?.(next.id)}
          >
            {next.label}
          </button>
        )}
      </div>

      {next && (
        <p className="muted" style={{ marginTop: "-0.35rem" }}>
          {next.tip}
        </p>
      )}

      {toast && (
        <div className={`toast ${toast.tone === "success" ? "toast-ok" : ""}`}>
          {toast.text}
        </div>
      )}
      {error && <div className="toast">{error}</div>}
      <ResultViewer run={run} />
    </section>
  );
}
