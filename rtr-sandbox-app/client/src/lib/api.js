export async function fetchHealth() {
  const res = await fetch("/api/health");
  return res.json();
}

export async function fetchScenarios() {
  const res = await fetch("/api/scenarios");
  return res.json();
}

export async function runScenario(scenarioId, form = {}) {
  const res = await fetch(`/api/run/${scenarioId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ form }),
  });
  const data = await res.json();
  if (!res.ok && !data.steps) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}
