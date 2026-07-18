import { useEffect, useMemo, useState } from "react";
import ScenarioNav from "./components/ScenarioNav.jsx";
import ScenarioWorkspace from "./components/ScenarioWorkspace.jsx";
import { fetchHealth, fetchScenarios } from "./lib/api.js";

export default function App() {
  const [mode, setMode] = useState("demo");
  const [scenarios, setScenarios] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const [health, catalog] = await Promise.all([
          fetchHealth(),
          fetchScenarios(),
        ]);
        if (cancelled) return;
        setMode(health.mode || catalog.mode || "demo");
        setScenarios(catalog.scenarios || []);
        setActiveId(catalog.scenarios?.[0]?.id || "");
      } catch (error) {
        if (!cancelled) {
          setBootError(
            error.message ||
              "Unable to reach the local API. Start the server with npm run dev."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeId),
    [scenarios, activeId]
  );

  return (
    <div className="app-shell">
      <header className="brand-bar">
        <div className="brand-mark">
          <div className="brand-orb" aria-hidden="true" />
          <div className="brand-text">
            <strong>RTR Rail Lab</strong>
            <span>Payments Canada Real-Time Rail sandbox</span>
          </div>
        </div>
        <div className={`mode-pill ${mode === "live" ? "live" : ""}`}>
          <span className="dot" />
          {mode === "live" ? "Live sandbox" : "Demo mode"}
        </div>
      </header>

      <section className="hero">
        <h1>RTR Rail Lab</h1>
        <p>
          Interactively exercise every Real-Time Rail sandbox scenario — OAuth,
          pacs.008 payments, status enquiry, heartbeat, interest and balance
          reports — against Payments Canada’s ISO 20022 APIs.
        </p>
      </section>

      {loading && (
        <div className="panel workspace">
          <div className="empty-state">Loading scenarios…</div>
        </div>
      )}

      {bootError && (
        <div className="panel workspace">
          <div className="toast">{bootError}</div>
        </div>
      )}

      {!loading && !bootError && (
        <div className="layout">
          <ScenarioNav
            scenarios={scenarios}
            activeId={activeId}
            onSelect={setActiveId}
          />
          <ScenarioWorkspace scenario={activeScenario} mode={mode} />
        </div>
      )}
    </div>
  );
}
