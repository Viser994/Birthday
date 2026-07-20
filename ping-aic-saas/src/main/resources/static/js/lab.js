const consoleEl = document.getElementById("console");
const usersBox = document.getElementById("usersBox");
const auditBox = document.getElementById("auditBox");
let sessionToken = localStorage.getItem("pingAicSession") || "";

function show(data) {
  consoleEl.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
}

function formToJson(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function refreshGuide() {
  const guide = await api("/api/guide");
  document.getElementById("modePill").textContent = `Mode: ${guide.mode}${guide.aicEnabled ? " (AIC linked)" : ""}`;
  const host = document.getElementById("guideSteps");
  host.innerHTML = "";
  (guide.steps || []).forEach((s) => {
    const div = document.createElement("div");
    div.className = "step-card";
    div.innerHTML = `<b>Step ${s.n}. ${s.title}</b><span>${s.concept}</span>`;
    host.appendChild(div);
  });
  auditBox.textContent = JSON.stringify(guide.recentAudit || [], null, 2);
}

async function refreshUsers() {
  const data = await api("/api/users");
  usersBox.textContent = JSON.stringify(data.users || [], null, 2);
  const audit = await api("/api/audit");
  auditBox.textContent = JSON.stringify(audit.events || [], null, 2);
}

document.getElementById("provisionForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const body = formToJson(e.target);
    body.passwordlessEnabled = true;
    const data = await api("/api/provision", { method: "POST", body: JSON.stringify(body) });
    show(data);
    await refreshUsers();
  } catch (err) {
    show({ error: err.message });
  }
});

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await api("/api/register/start", {
      method: "POST",
      body: JSON.stringify(formToJson(e.target)),
    });
    show(data);
    document.getElementById("registerVerifyForm").classList.remove("hidden");
    document.getElementById("regChallengeId").value = data.challengeId;
    document.getElementById("regOtp").value = data.demoOtp || "";
    const magic = document.getElementById("regMagic");
    magic.href = data.magicLink;
    magic.textContent = "Open magic link";
  } catch (err) {
    show({ error: err.message });
  }
});

document.getElementById("registerVerifyForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await api("/api/register/verify", {
      method: "POST",
      body: JSON.stringify(formToJson(e.target)),
    });
    show(data);
    await refreshUsers();
  } catch (err) {
    show({ error: err.message });
  }
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await api("/api/login/start", {
      method: "POST",
      body: JSON.stringify(formToJson(e.target)),
    });
    show(data);
    document.getElementById("loginVerifyForm").classList.remove("hidden");
    document.getElementById("loginChallengeId").value = data.challengeId;
    document.getElementById("loginOtp").value = data.demoOtp || "";
    const magic = document.getElementById("loginMagic");
    magic.href = data.magicLink;
    magic.textContent = "Open magic link";
  } catch (err) {
    show({ error: err.message });
  }
});

document.getElementById("loginVerifyForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await api("/api/login/verify", {
      method: "POST",
      body: JSON.stringify(formToJson(e.target)),
    });
    show(data);
    if (data.tokenId) {
      sessionToken = data.tokenId;
      localStorage.setItem("pingAicSession", sessionToken);
    }
    await refreshUsers();
  } catch (err) {
    show({ error: err.message });
  }
});

document.getElementById("meBtn").addEventListener("click", async () => {
  try {
    if (!sessionToken) {
      show({ error: "No session yet — complete passwordless login first" });
      return;
    }
    const data = await api("/api/session/me", {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    show(data);
  } catch (err) {
    show({ error: err.message });
  }
});

document.getElementById("refreshUsers").addEventListener("click", () => refreshUsers());

refreshGuide().then(refreshUsers).catch((err) => show({ error: err.message }));
