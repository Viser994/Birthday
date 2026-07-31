import { useState } from "react";
import { saveCredentials } from "../lib/api.js";

export default function CredentialsPanel({ health, onUpdated }) {
  const [key, setKey] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const authMeta = health?.authMeta;
  const productMismatch = health?.mode === "live" && authMeta && !authMeta.productOk;

  async function onSave(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await saveCredentials({ consumerKey: key, consumerSecret: secret });
      setMessage("Credentials saved. Re-checking token product…");
      setKey("");
      setSecret("");
      await onUpdated?.();
    } catch (err) {
      setError(err.message || "Failed to save credentials");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel credentials-panel">
      <div className="credentials-head">
        <div>
          <h2>Developer Portal credentials</h2>
          <p>
            Live RTR calls need Consumer Key + Secret from an app created with
            product <code>rtr-sandbox-product</code>.
          </p>
        </div>
        <div className="meta-row">
          <span className="chip">
            {health?.hasCredentials
              ? `Key ${health.consumerKeyHint}`
              : "No credentials"}
          </span>
          {authMeta?.products?.length > 0 && (
            <span className={`chip ${authMeta.productOk ? "" : "amber"}`}>
              Product: {authMeta.products.join(", ")}
            </span>
          )}
        </div>
      </div>

      {productMismatch && (
        <p className="toast">
          {authMeta.warning ||
            "Your token works, but it is not for the RTR sandbox product. Create a new app with rtr-sandbox-product in My Apps, then paste those credentials here."}
        </p>
      )}

      <form className="credentials-form" onSubmit={onSave}>
        <div className="field">
          <label htmlFor="consumerKey">Consumer Key</label>
          <input
            id="consumerKey"
            autoComplete="off"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Paste Consumer Key"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="consumerSecret">Consumer Secret</label>
          <input
            id="consumerSecret"
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Paste Consumer Secret"
            required
          />
        </div>
        <div className="actions" style={{ marginBottom: 0 }}>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save & validate"}
          </button>
        </div>
      </form>

      {message && (
        <p className="hint" style={{ marginTop: "0.85rem", marginBottom: 0 }}>
          {message}
        </p>
      )}
      {error && <div className="toast" style={{ marginTop: "0.85rem" }}>{error}</div>}
    </section>
  );
}
