import { useCallback, useEffect, useMemo, useState } from "react";
import ActivityPanel from "./components/ActivityPanel.jsx";
import CredentialsPanel from "./components/CredentialsPanel.jsx";
import GuidedTour from "./components/GuidedTour.jsx";
import ScenarioNav from "./components/ScenarioNav.jsx";
import ScenarioWorkspace from "./components/ScenarioWorkspace.jsx";
import { fetchHealth, fetchScenarios, runScenario } from "./lib/api.js";
import {
  extractPaymentContext,
  GUIDED_STEPS,
  loadSession,
  saveSession,
  summarizeRun,
} from "./lib/sessionStore.js";

export default function App() {
  const [health, setHealth] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState("");
  const [session, setSession] = useState(() => loadSession());
  const [tourRunning, setTourRunning] = useState(false);
  const [tourStepId, setTourStepId] = useState("");
  const [externalRun, setExternalRun] = useState(null);
  const [banner, setBanner] = useState(null);

  const refreshHealth = useCallback(async () => {
    const next = await fetchHealth();
    setHealth(next);
    return next;
  }, []);

  useEffect(() => {
    saveSession(session);
  }, [session]);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const [nextHealth, catalog] = await Promise.all([
          fetchHealth(),
          fetchScenarios(),
        ]);
        if (cancelled) return;
        setHealth(nextHealth);
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

  const mode = health?.mode || "demo";
  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeId),
    [scenarios, activeId]
  );

  const recordRun = useCallback((run) => {
    const summary = summarizeRun(run);
    const payment = extractPaymentContext(run);
    setSession((prev) => ({
      completedIds: prev.completedIds.includes(run.scenarioId)
        ? prev.completedIds
        : [...prev.completedIds, run.scenarioId],
      lastPayment: payment || prev.lastPayment,
      activity: [summary, ...prev.activity].slice(0, 30),
    }));
    return summary;
  }, []);

  const navigateTo = useCallback((id) => {
    setActiveId(id);
    setExternalRun(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const checkLastPayment = useCallback(() => {
    if (!session.lastPayment) return;
    setActiveId("payment-status");
    setExternalRun(null);
    setBanner({
      tone: "success",
      text: "Opened Payment Status Enquiry with your latest payment IDs.",
    });
  }, [session.lastPayment]);

  async function runGuidedTour() {
    if (tourRunning) return;
    setTourRunning(true);
    setBanner(null);

    try {
      let paymentForm = {};
      let paused = false;

      for (const step of GUIDED_STEPS) {
        setTourStepId(step.id);
        setActiveId(step.id);

        let form = {};
        if (step.id === "payment-status") {
          form = {
            fromMember:
              paymentForm.fromMember || session.lastPayment?.fromMember || "111",
            toMember:
              paymentForm.toMember || session.lastPayment?.toMember || "999",
            originalMessageId:
              paymentForm.messageId || session.lastPayment?.messageId || "",
            originalEndToEndId:
              paymentForm.endToEndId || session.lastPayment?.endToEndId || "",
            originalUetr: paymentForm.uetr || session.lastPayment?.uetr || "",
          };
        } else if (step.id === "send-payment") {
          form = {
            fromMember: "111",
            toMember: "999",
            amount: "100",
            debtorName: "Alex Rivera",
            creditorName: "Jordan Lee",
          };
        }

        const result = await runScenario(step.id, form);
        setExternalRun(result);
        recordRun(result);

        if (step.id === "send-payment") {
          const ctx = extractPaymentContext(result);
          if (ctx) paymentForm = ctx;
        }

        const last = result.steps?.[result.steps.length - 1]?.result;
        const ok = last?.ok !== false && (last?.status ?? 200) < 400;
        if (!ok && step.id !== "send-payment-reject") {
          paused = true;
          setBanner({
            tone: "error",
            text: `Guided tour paused at “${step.title}” (HTTP ${last?.status ?? "—"}). Fix the issue, then continue manually.`,
          });
          break;
        }
      }

      if (!paused) {
        setBanner({
          tone: "success",
          text: "Guided tour finished — token, heartbeat, payment, and status enquiry are done.",
        });
      }
    } catch (error) {
      setBanner({
        tone: "error",
        text: error.message || "Guided tour failed",
      });
    } finally {
      setTourRunning(false);
      setTourStepId("");
    }
  }

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
          A guided, readable workspace for Real-Time Rail sandbox APIs — send
          payments, understand statuses, and follow the next best step without
          digging through raw ISO 20022 JSON.
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
        <>
          <CredentialsPanel health={health} onUpdated={refreshHealth} />

          {banner && (
            <div
              className={`toast ${banner.tone === "success" ? "toast-ok" : ""}`}
              style={{ marginTop: "1rem" }}
            >
              {banner.text}
            </div>
          )}

          <div style={{ marginTop: "1.25rem" }}>
            <GuidedTour
              completedIds={session.completedIds}
              running={tourRunning}
              currentStepId={tourStepId}
              onStart={runGuidedTour}
              onJump={navigateTo}
            />
          </div>

          <div className="layout layout-3" style={{ marginTop: "1.25rem" }}>
            <ScenarioNav
              scenarios={scenarios}
              activeId={activeId}
              completedIds={session.completedIds}
              onSelect={navigateTo}
            />
            <ScenarioWorkspace
              scenario={activeScenario}
              mode={mode}
              productOk={
                health?.authMeta?.productOk !== false || mode === "demo"
              }
              productWarning={health?.authMeta?.warning}
              paymentContext={session.lastPayment}
              externalRun={externalRun}
              onRunComplete={recordRun}
              onNavigate={navigateTo}
            />
            <ActivityPanel
              activity={session.activity}
              lastPayment={session.lastPayment}
              onOpenScenario={navigateTo}
              onCheckLastPayment={checkLastPayment}
              onClear={() =>
                setSession({ completedIds: [], lastPayment: null, activity: [] })
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
