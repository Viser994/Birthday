import { STATUS_GLOSSARY } from "../lib/sessionStore.js";

function relativeTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleString("en-CA");
}

export default function ActivityPanel({
  activity = [],
  lastPayment,
  onOpenScenario,
  onCheckLastPayment,
  onClear,
}) {
  return (
    <aside className="panel activity-panel">
      <div className="activity-head">
        <h2>Session activity</h2>
        {activity.length > 0 && (
          <button type="button" className="linkish" onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      {lastPayment && (
        <div className="last-payment-card">
          <div className="summary-kicker">Latest payment</div>
          <strong>
            {lastPayment.debtor || "Debtor"} → {lastPayment.creditor || "Creditor"}
          </strong>
          <p>
            {lastPayment.amount != null
              ? `${lastPayment.currency || "CAD"} ${lastPayment.amount}`
              : "Payment captured"}
            {lastPayment.status ? ` · ${lastPayment.status}` : ""}
          </p>
          <code>{lastPayment.uetr || lastPayment.endToEndId || "No UETR"}</code>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.7rem" }}
            onClick={onCheckLastPayment}
          >
            Check this payment’s status
          </button>
        </div>
      )}

      <div className="group-label">Recent runs</div>
      {activity.length === 0 ? (
        <p className="muted">Run a scenario to build your session timeline.</p>
      ) : (
        <ul className="activity-list">
          {activity.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => onOpenScenario(item.scenarioId)}>
                <span className={`activity-dot ${item.ok ? "ok" : "bad"}`} />
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.status || "—"} · HTTP {item.http ?? "—"} ·{" "}
                    {relativeTime(item.at)}
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <details className="glossary">
        <summary>Status code glossary</summary>
        <ul>
          {STATUS_GLOSSARY.map((item) => (
            <li key={item.code}>
              <strong>{item.code}</strong>
              <span>{item.meaning}</span>
              <small>{item.tip}</small>
            </li>
          ))}
        </ul>
      </details>
    </aside>
  );
}
