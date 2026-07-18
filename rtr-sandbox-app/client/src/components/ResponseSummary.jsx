import { useState } from "react";

function toneClass(tone) {
  if (tone === "success") return "tone-success";
  if (tone === "error") return "tone-error";
  if (tone === "warn") return "tone-warn";
  if (tone === "info") return "tone-info";
  return "tone-neutral";
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function FieldRow({ field }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    const ok = await copyText(field.value);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }

  return (
    <div className="summary-field">
      <dt>{field.label}</dt>
      <dd className={field.mono ? "mono" : undefined}>
        <span>{field.value}</span>
        {field.copy && (
          <button type="button" className="copy-btn" onClick={onCopy}>
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </dd>
    </div>
  );
}

export default function ResponseSummary({ view, title }) {
  if (!view) {
    return (
      <div className="summary-card empty">
        <p>No payload to display.</p>
      </div>
    );
  }

  return (
    <div className={`summary-card ${toneClass(view.tone)}`}>
      <div className="summary-top">
        <div>
          {title && <div className="summary-kicker">{title}</div>}
          <h3>{view.headline}</h3>
          {view.subtitle && <p className="summary-subtitle">{view.subtitle}</p>}
        </div>
        <div className="summary-badges">
          {view.badges?.map((badge) => (
            <span
              key={`${badge.text}-${badge.tone}`}
              className={`summary-badge ${toneClass(badge.tone)}`}
            >
              {badge.text}
            </span>
          ))}
        </div>
      </div>

      {view.summary && <p className="summary-text">{view.summary}</p>}

      {view.highlights?.length > 0 && (
        <dl className="summary-fields">
          {view.highlights.map((f) => (
            <FieldRow key={`${f.label}-${f.value}`} field={f} />
          ))}
        </dl>
      )}

      {view.tables?.map((table) => (
        <div className="summary-table-wrap" key={table.title}>
          <h4>{table.title}</h4>
          <table className="summary-table">
            <thead>
              <tr>
                {table.columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, idx) => (
                <tr key={`${table.title}-${idx}`}>
                  {row.map((cell, cellIdx) => (
                    <td key={`${idx}-${cellIdx}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {view.sections?.map((section) =>
        section.fields?.length ? (
          <div className="summary-section" key={section.title}>
            <h4>{section.title}</h4>
            <dl className="summary-fields compact">
              {section.fields.map((f) => (
                <FieldRow key={`${section.title}-${f.label}`} field={f} />
              ))}
            </dl>
          </div>
        ) : null
      )}
    </div>
  );
}
