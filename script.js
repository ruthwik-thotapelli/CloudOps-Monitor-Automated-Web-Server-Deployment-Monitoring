"use strict";

document.documentElement.classList.add("js");

const menuButton = document.getElementById("mobileMenuBtn");
const mobileMenu = document.getElementById("mobileMenu");

function setMenuOpen(isOpen) {
  if (!menuButton || !mobileMenu) return;
  menuButton.setAttribute("aria-expanded", String(isOpen));
  mobileMenu.setAttribute("aria-hidden", String(!isOpen));
  mobileMenu.classList.toggle("is-open", isOpen);
}

if (menuButton && mobileMenu) {
  menuButton.addEventListener("click", () => {
    setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false);
      menuButton.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      menuButton.getAttribute("aria-expanded") === "true" &&
      !mobileMenu.contains(event.target) &&
      !menuButton.contains(event.target)
    ) {
      setMenuOpen(false);
    }
  });
}

const workflowTabs = Array.from(document.querySelectorAll(".step-btn"));
const workflowPanels = Array.from(document.querySelectorAll(".step-panel"));

function activateWorkflowStep(stepNumber, moveFocus) {
  const selectedTab = workflowTabs.find((tab) => tab.dataset.step === String(stepNumber));
  if (!selectedTab) return;

  workflowTabs.forEach((tab) => {
    const isSelected = tab === selectedTab;
    tab.classList.toggle("active", isSelected);
    tab.setAttribute("aria-selected", String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
  });

  workflowPanels.forEach((panel) => {
    const isSelected = panel.id === selectedTab.getAttribute("aria-controls");
    panel.classList.toggle("active", isSelected);
    panel.setAttribute("aria-hidden", String(!isSelected));
  });

  if (moveFocus) selectedTab.focus();
}

workflowTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateWorkflowStep(tab.dataset.step, false));
  tab.addEventListener("keydown", (event) => {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % workflowTabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + workflowTabs.length) % workflowTabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = workflowTabs.length - 1;
    else return;

    event.preventDefault();
    activateWorkflowStep(workflowTabs[nextIndex].dataset.step, true);
  });
});

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const simulateButton = document.getElementById("simulateHealBtn");
const feedback = document.getElementById("simulationFeedback");

function setStatus(id, value, state) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = value;
  if (element.classList.contains("badge-status") || element.classList.contains("status-chip")) {
    element.classList.toggle("badge-critical", state === "critical");
    element.classList.toggle("chip-critical", state === "critical");
    element.classList.toggle("badge-ok", state === "ok");
    element.classList.toggle("chip-ok", state === "ok");
  }
}

function setCardState(id, isCritical) {
  const card = document.getElementById(id);
  if (card) card.classList.toggle("is-critical", isCritical);
}

function showFeedback(message, isCritical) {
  if (!feedback) return;
  feedback.classList.toggle("is-critical", isCritical);
  feedback.querySelector(".sim-text").innerHTML = message;
}

if (simulateButton && feedback) {
  simulateButton.addEventListener("click", () => {
    if (simulateButton.disabled) return;
    simulateButton.disabled = true;
    simulateButton.querySelector("span").textContent = "Running demo…";
    showFeedback("<strong>DEMO SIMULATION:</strong> The mock Nagios checks now show a service interruption. No real host or service is being changed.", true);

    window.setTimeout(() => {
      setStatus("badgeHost", "DOWN · DEMO", "critical");
      setStatus("valHost", "Host unavailable", "critical");
      setStatus("badgeHttp", "CRITICAL · DEMO", "critical");
      setStatus("valHttp", "Connection refused", "critical");
      setStatus("subHttp", "Simulated interruption");
      setStatus("badgePuppet", "ENFORCING · DEMO", "critical");
      setStatus("valPuppet", "Applying catalog", "critical");
      setStatus("subPuppet", "Simulated reconciliation");
      setStatus("chipPing", "CRITICAL", "critical");
      setStatus("chipHttp", "CRITICAL", "critical");
      setStatus("chipProc", "CRITICAL", "critical");
      setStatus("msgPing", "DEMO: Simulated host check failure");
      setStatus("msgHttp", "DEMO: Connection refused on the example endpoint");
      setStatus("msgProc", "DEMO: Nginx process check reports a simulated stop");
      setCardState("cardHostStatus", true);
      setCardState("cardHttpService", true);
      setCardState("cardPuppetSync", true);
      ["row-ping", "row-http", "row-nginx-proc"].forEach((id) => {
        const row = document.getElementById(id);
        if (row) row.classList.add("is-critical");
      });

      window.setTimeout(() => {
        setStatus("badgePuppet", "RESTORED · DEMO", "ok");
        setStatus("valPuppet", "Desired state restored", "ok");
        setStatus("subPuppet", "Simulated catalog applied");
        showFeedback("<strong>DEMO SIMULATION:</strong> The mock Puppet run restores the example service state; the sample Nagios checks return to OK. This is a front-end animation only.", false);

        window.setTimeout(() => {
          setStatus("badgeHost", "UP · DEMO", "ok");
          setStatus("valHost", "1 Host Up", "ok");
          setStatus("badgeHttp", "OK · DEMO", "ok");
          setStatus("valHttp", "HTTP/1.1 200 OK", "ok");
          setStatus("subHttp", "Example response · 2.14 ms");
          setStatus("badgePuppet", "IN SYNC · DEMO", "ok");
          setStatus("valPuppet", "Desired state", "ok");
          setStatus("subPuppet", "Static example state");
          setStatus("chipPing", "OK · DEMO", "ok");
          setStatus("chipHttp", "OK · DEMO", "ok");
          setStatus("chipProc", "OK · DEMO", "ok");
          setStatus("msgPing", "DEMO: Example ping result · 0% packet loss");
          setStatus("msgHttp", "DEMO: Example HTTP/1.1 200 OK response");
          setStatus("msgProc", "DEMO: Example Nginx process check passed");
          setCardState("cardHostStatus", false);
          setCardState("cardHttpService", false);
          setCardState("cardPuppetSync", false);
          ["row-ping", "row-http", "row-nginx-proc"].forEach((id) => {
            const row = document.getElementById(id);
            if (row) row.classList.remove("is-critical");
          });
          showFeedback("<strong>Interactive demo:</strong> Click “Simulate Drift &amp; Heal” to replay this front-end-only failure and recovery scenario. All displayed monitoring values are examples, not live telemetry.", false);
          simulateButton.querySelector("span").textContent = "Simulate Drift & Heal";
          simulateButton.disabled = false;
        }, 1100);
      }, 1050);
    }, 750);
  });
}
