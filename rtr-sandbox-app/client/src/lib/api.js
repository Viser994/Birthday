export async function fetchHealth() {
  const res = await fetch("/api/health");
  return res.json();
}

export async function fetchScenarios() {
  const res = await fetch("/api/scenarios");
  return res.json();
}

export async function saveCredentials({ consumerKey, consumerSecret }) {
  const res = await fetch("/api/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consumerKey, consumerSecret }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Failed to save credentials (${res.status})`);
  }
  return data;
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
