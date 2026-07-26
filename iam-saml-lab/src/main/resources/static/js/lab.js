async function api(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function el(id) {
  return document.getElementById(id);
}

function renderGuide(guide) {
  const actors = el("actors");
  if (actors && guide.actors) {
    actors.innerHTML = guide.actors
      .map(
        (a) => `<article class="actor">
          <p class="role">${a.role}</p>
          <h3>${a.name}</h3>
          <p>${a.job}</p>
          <code>${a.entityId}</code>
        </article>`
      )
      .join("");
  }

  const concepts = el("concepts");
  if (concepts && guide.concepts) {
    concepts.innerHTML = guide.concepts
      .map((c) => `<li><strong>${c.term}</strong><span>${c.meaning}</span></li>`)
      .join("");
  }

  const steps = el("flowSteps");
  if (steps && guide.flowSteps) {
    steps.innerHTML = guide.flowSteps
      .map((s) => `<li><strong>${s.n}. ${s.title}</strong><span>${s.detail}</span></li>`)
      .join("");
  }

  const tryThis = el("tryThis");
  if (tryThis && guide.tryThis) {
    tryThis.innerHTML = guide.tryThis.map((t) => `<li>${t}</li>`).join("");
  }

  const users = el("users");
  if (users && guide.demoUsers) {
    users.innerHTML = guide.demoUsers
      .map(
        (u) => `<div class="user"><strong>${u.username}</strong><span>${u.displayName}</span><span>${u.department}</span></div>`
      )
      .join("");
  }
}

function renderFlow(flow) {
  const timeline = el("timeline");
  if (!timeline) return;
  if (!flow.steps || flow.steps.length === 0) {
    timeline.innerHTML = `<li class="empty">Start SSO to populate the timeline. Status: ${flow.status || "NONE"}</li>`;
    return;
  }
  timeline.innerHTML = flow.steps
    .map(
      (s) => `<li>
        <span class="actor-tag">${s.actor}</span>
        <strong>${s.title}</strong>
        <p>${s.detail}</p>
      </li>`
    )
    .join("");
}

function renderSession(session) {
  const consoleEl = el("sessionConsole");
  if (!consoleEl) return;
  consoleEl.textContent = JSON.stringify(session, null, 2);
}

async function refreshGuide() {
  const guide = await api("/api/guide");
  renderGuide(guide);
}

async function refreshFlow() {
  const flow = await api("/api/flow");
  renderFlow(flow);
}

async function refreshSession() {
  const session = await api("/api/session");
  renderSession(session);
}

el("refreshGuide")?.addEventListener("click", () => refreshGuide().catch(console.error));
el("refreshFlow")?.addEventListener("click", () => refreshFlow().catch(console.error));
el("refreshSession")?.addEventListener("click", () => refreshSession().catch(console.error));

refreshGuide()
  .then(() => Promise.all([refreshFlow(), refreshSession()]))
  .catch((err) => {
    const consoleEl = el("sessionConsole");
    if (consoleEl) consoleEl.textContent = String(err);
  });

setInterval(() => {
  refreshFlow().catch(() => {});
}, 4000);
