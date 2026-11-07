
"use strict";

/**
 * ProofPath PP-04-B browser presentation.
 *
 * Consumes only the server's allowlisted diagnostic response.
 * Never parses source evidence, raw receipts or policy data.
 * Untrusted values are rendered using textContent only.
 */

const SCENARIOS = new Set([
  "consistent",
  "missing-evidence",
  "binding-conflict",
  "unsupported-assurance"
]);

const buttons = Array.from(
  document.querySelectorAll("[data-scenario]")
);

const statusElement =
  document.getElementById("composition-status");
const runStatus =
  document.getElementById("run-status");
const notice =
  document.getElementById("adversarial-notice");
const diagnostics =
  document.getElementById("diagnostics");

const assessmentIds = {
  receipt: "receipt-status",
  settlement: "settlement-status",
  agentAuthority: "agent-status",
  seller: "seller-status"
};

let requestSequence = 0;
let currentController = null;

function text(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = String(value);
  }
}

function setSelected(scenarioId) {
  for (const button of buttons) {
    const selected =
      button.dataset.scenario === scenarioId;

    button.classList.toggle("active", selected);
    button.setAttribute(
      "aria-pressed",
      String(selected)
    );
  }
}

function setDiagnostics(codes) {
  diagnostics.replaceChildren();

  if (!Array.isArray(codes) || codes.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No diagnostic reasons reported.";
    diagnostics.appendChild(li);
    return;
  }

  for (const code of codes) {
    const li = document.createElement("li");
    li.textContent = String(code)
      .replaceAll("_", " ");
    diagnostics.appendChild(li);
  }
}

function clearResults() {
  statusElement.textContent = "Evaluating";
  statusElement.dataset.status = "loading";

  text("manifest-status", "Awaiting composition");

  for (const id of Object.values(assessmentIds)) {
    text(id, "—");
  }

  setDiagnostics([]);
  notice.hidden = true;
}

function render(data) {
  const status = data.compositionStatus;

  statusElement.textContent = status;
  statusElement.dataset.status = status;

  text(
    "manifest-status",
    data.manifestPresent
      ? "Present · schema-validated, not authenticated"
      : "Absent · composition rejected"
  );

  for (const [field, id] of Object.entries(assessmentIds)) {
    text(
      id,
      data.assessments?.[field] ?? "unavailable"
    );
  }

  setDiagnostics(data.diagnosticCodes);

  notice.hidden = !data.adversarialCompositionInput;

  const assuranceMessage =
    "No transaction-wide assurance established.";

  runStatus.textContent =
    "Demonstration executed. " + assuranceMessage;
}

async function runScenario(scenarioId) {
  if (!SCENARIOS.has(scenarioId)) {
    return;
  }

  if (currentController !== null) {
    currentController.abort();
  }

  const sequence = ++requestSequence;
  const controller = new AbortController();

  currentController = controller;

  setSelected(scenarioId);
  clearResults();

  runStatus.textContent = "Evaluating synthetic fixture…";

  try {
    const url = new URL("/api/scenario", location.origin);
    url.searchParams.set("scenario", scenarioId);

    const response = await fetch(url, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error("scenario_request_failed");
    }

    const data = await response.json();

    if (sequence !== requestSequence) {
      return;
    }

    if (
      data.scenarioId !== scenarioId ||
      data.sourceMode !== "fixture" ||
      data.executionCompleted !== true ||
      data.transactionVerified !== false ||
      data.syntheticSourceAuthentication !== false ||
      data.disclosure !== "diagnostic_summary_only" ||
      !["incomplete", "rejected", "composed"]
        .includes(data.compositionStatus)
    ) {
      throw new Error("invalid_demo_response");
    }

    render(data);
  } catch (error) {
    if (
      sequence !== requestSequence ||
      error?.name === "AbortError"
    ) {
      return;
    }

    statusElement.textContent = "Unavailable";
    statusElement.dataset.status = "error";

    runStatus.textContent =
      "The local assessment could not be completed.";

    text("manifest-status", "Unavailable");
    setDiagnostics(["demo_execution_failed"]);
    notice.hidden = true;
  } finally {
    if (sequence === requestSequence) {
      currentController = null;
    }
  }
}

for (const button of buttons) {
  button.addEventListener("click", () => {
    runScenario(button.dataset.scenario);
  });
}

runScenario("consistent");
