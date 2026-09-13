const API_KEY = "maple_sandbox_dev_key";
const headers = {
  "Content-Type": "application/json",
  "X-API-Key": API_KEY,
};

const form = document.getElementById("payment-form");
const requestPreview = document.getElementById("request-preview");
const resultJson = document.getElementById("result-json");
const resultStatus = document.getElementById("result-status");
const resultMeaning = document.getElementById("result-meaning");
const resultActions = document.getElementById("result-actions");
const rtrPanel = document.getElementById("rtr-panel");
const rtrJson = document.getElementById("rtr-json");
const historyBody = document.getElementById("history-body");
const opsLine = document.getElementById("ops-line");

let currentId = null;
let pollTimer = null;

function payload() {
  const body = {
    amount: document.getElementById("amount").value.trim(),
    currency: "CAD",
    payer: {
      name: document.getElementById("payer-name").value.trim(),
      account: document.getElementById("payer-account").value.trim(),
    },
    payee: {
      name: document.getElementById("payee-name").value.trim(),
      account: document.getElementById("payee-account").value.trim(),
    },
  };
  const reference = document.getElementById("reference").value.trim();
  const outcome = document.getElementById("test-outcome").value;
  if (reference) body.reference = reference;
  if (outcome) body.test_outcome = outcome;
  return body;
}

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function updatePreview() {
  requestPreview.textContent = pretty(payload());
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) {
    throw data;
  }
  return data;
}

function showPayment(payment) {
  currentId = payment.id;
  resultJson.textContent = pretty(payment);
  resultJson.classList.remove("empty");
  resultStatus.textContent = payment.status;
  resultStatus.className = `pill ${payment.status}`;
  resultMeaning.textContent = `${payment.status_meaning} ${payment.next_step}`;
  resultActions.classList.remove("hidden");
}

function showError(error) {
  const body = error.error || error;
  resultStatus.textContent = "error";
  resultStatus.className = "pill rejected";
  resultMeaning.textContent = body.message || "Request failed.";
  resultJson.textContent = pretty(error);
  resultJson.classList.remove("empty");
}

async function refreshHistory() {
  try {
    const data = await api("/v1/payments");
    if (!data.payments.length) {
      historyBody.innerHTML = `<tr><td colspan="6" class="empty-row">No payments yet.</td></tr>`;
      return;
    }
    historyBody.innerHTML = data.payments
      .map(
        (item) => `
        <tr data-id="${item.id}">
          <td><span class="badge ${item.status}">${item.status}</span></td>
          <td>${item.amount} ${item.currency}</td>
          <td>${item.payer.name}</td>
          <td>${item.payee.name}</td>
          <td>${item.reference}</td>
          <td><code>${item.id}</code></td>
        </tr>`
      )
      .join("");
    historyBody.querySelectorAll("tr[data-id]").forEach((row) => {
      row.style.cursor = "pointer";
      row.addEventListener("click", async () => {
        const payment = await api(`/v1/payments/${row.dataset.id}`);
        showPayment(payment);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  } catch (error) {
    opsLine.textContent = error.error?.message || "Could not load history.";
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(async () => {
    if (!currentId) return;
    try {
      const payment = await api(`/v1/payments/${currentId}`);
      showPayment(payment);
      await refreshHistory();
      if (["completed", "rejected"].includes(payment.status)) {
        stopPolling();
      }
    } catch {
      stopPolling();
    }
  }, 900);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

form.addEventListener("input", updatePreview);
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  stopPolling();
  rtrPanel.hidden = true;
  const wait = document.getElementById("wait-for-result").checked;
  const sendBtn = document.getElementById("send-btn");
  sendBtn.disabled = true;
  sendBtn.textContent = "Sending…";
  try {
    const payment = await api(`/v1/payments${wait ? "?wait_for_result=true" : ""}`, {
      method: "POST",
      body: JSON.stringify(payload()),
    });
    showPayment(payment);
    await refreshHistory();
    if (!["completed", "rejected"].includes(payment.status)) {
      startPolling();
    }
  } catch (error) {
    showError(error);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Send payment";
  }
});

document.getElementById("copy-curl").addEventListener("click", async () => {
  const wait = document.getElementById("wait-for-result").checked;
  const curl = [
    "curl -sS http://localhost:8080/v1/payments" + (wait ? "?wait_for_result=true" : ""),
    "  -H 'Content-Type: application/json'",
    "  -H 'X-API-Key: maple_sandbox_dev_key'",
    `  -d '${JSON.stringify(payload())}'`,
  ].join(" \\\n");
  await navigator.clipboard.writeText(curl);
  document.getElementById("copy-curl").textContent = "Copied";
  setTimeout(() => {
    document.getElementById("copy-curl").textContent = "Copy curl";
  }, 1200);
});

document.getElementById("refresh-btn").addEventListener("click", async () => {
  if (!currentId) return;
  showPayment(await api(`/v1/payments/${currentId}`));
  await refreshHistory();
});

document.getElementById("check-btn").addEventListener("click", async () => {
  if (!currentId) return;
  showPayment(await api(`/v1/payments/${currentId}/status-check`, { method: "POST" }));
  await refreshHistory();
});

document.getElementById("explain-btn").addEventListener("click", async () => {
  if (!currentId) return;
  const explained = await api(`/v1/payments/${currentId}/rtr`);
  rtrJson.textContent = pretty(explained);
  rtrPanel.hidden = false;
  rtrPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("reload-btn").addEventListener("click", refreshHistory);
document.getElementById("health-btn").addEventListener("click", async () => {
  opsLine.textContent = pretty(await api("/v1/health"));
});
document.getElementById("balance-btn").addEventListener("click", async () => {
  opsLine.textContent = pretty(await api("/v1/balance"));
});

updatePreview();
refreshHistory();
