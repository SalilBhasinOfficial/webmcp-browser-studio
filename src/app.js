import { SITE_DEFINITIONS, normalizeAddress, toolAnnotations, validateToolInput } from "./bridge.js";

const state = {
  address: "demo://voyager-stays",
  history: ["demo://voyager-stays"],
  historyIndex: 0,
  active: new Map(),
  aborters: new Map(),
  traces: [],
  shortlist: new Set(),
  results: null,
  permit: null
};

const el = (id) => document.getElementById(id);
const viewport = el("browserViewport");
const approvalDialog = el("approvalDialog");
let pendingApproval = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function trace(kind, message, detail = "") {
  const entry = { kind, message, detail, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) };
  state.traces.unshift(entry);
  state.traces = state.traces.slice(0, 20);
  renderTrace();
}

function toast(message) {
  el("toast").textContent = message;
  el("toast").classList.add("show");
  window.setTimeout(() => el("toast").classList.remove("show"), 2400);
}

function currentSite() { return SITE_DEFINITIONS[state.address]; }

function revokeToolsOutside(address) {
  const allowed = new Set((SITE_DEFINITIONS[address]?.candidates || []).map((tool) => tool.name));
  for (const name of [...state.active.keys()]) {
    if (!allowed.has(name)) revokeTool(name);
  }
}

function navigate(raw, addHistory = true) {
  const address = normalizeAddress(raw);
  revokeToolsOutside(address);
  state.address = address;
  if (addHistory) {
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(address);
    state.historyIndex = state.history.length - 1;
  }
  el("addressInput").value = address;
  renderPage();
  renderTools();
  trace("navigate", "Page opened", address);
}

function renderPage() {
  const site = currentSite();
  el("tabTitle").textContent = site?.title || new URL(state.address).hostname;
  if (site?.id === "voyager") renderVoyager();
  else if (site?.id === "civic") renderCivic();
  else renderExternal();
  el("backButton").disabled = state.historyIndex <= 0;
  el("forwardButton").disabled = state.historyIndex >= state.history.length - 1;
}

function renderVoyager() {
  const cards = [
    ["harbor-house", "Harbor House", "Lisbon", "€184", "Sea air, tiled courtyards, and a desk in the sun.", "coral"],
    ["pine-retreat", "Pine Retreat", "Sintra", "€142", "A quiet cabin beneath old pines, forty minutes from town.", "green"],
    ["atelier-loft", "Atelier Loft", "Lisbon", "€209", "Gallery walls and a rooftop made for late breakfasts.", "amber"]
  ];
  viewport.innerHTML = `
    <div class="demo-site voyager-site">
      <nav class="site-nav"><b>VOYAGER</b><span>Stays</span><span>Field notes</span><span>Shortlist <em>${state.shortlist.size}</em></span></nav>
      <section class="site-hero"><p>GO SOMEWHERE<br>WORTH REMEMBERING.</p><span>Independent stays for curious people.</span></section>
      <form id="staySearch" class="search-card">
        <label>WHERE<input name="destination" value="Lisbon" required></label>
        <label>CHECK IN<input name="checkIn" type="date" value="2026-10-12" required></label>
        <label>CHECK OUT<input name="checkOut" type="date" value="2026-10-16" required></label>
        <label>GUESTS<input name="guests" type="number" min="1" max="8" value="2" required></label>
        <button>Search stays</button>
      </form>
      <div class="result-title"><div><small>CURATED FOR YOU</small><h2>${state.results ? `Stays near ${escapeHtml(state.results.destination)}` : "Places with a point of view"}</h2></div><span>${cards.length} stays</span></div>
      <div class="stay-grid">${cards.map(([id, name, city, price, copy, tone]) => `
        <article class="stay-card"><div class="stay-art ${tone}"><span>${city}</span></div><div class="stay-body"><div><h3>${name}</h3><p>${copy}</p></div><div class="stay-meta"><b>${price}<small> / night</small></b><button data-shortlist="${id}" class="heart ${state.shortlist.has(id) ? "saved" : ""}" aria-label="Shortlist ${name}">♥</button></div></div></article>`).join("")}</div>
    </div>`;
  el("staySearch").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    runAction("search_stays", { ...data, guests: Number(data.guests) }, "human");
  });
  viewport.querySelectorAll("[data-shortlist]").forEach((button) => button.addEventListener("click", () => runAction("shortlist_stay", { propertyId: button.dataset.shortlist }, "human")));
}

function renderCivic() {
  viewport.innerHTML = `
    <div class="demo-site civic-site">
      <nav class="civic-nav"><div class="civic-seal">C</div><b>CIVIC DESK</b><span>Applications</span><span>Requirements</span><span>Help</span></nav>
      <section class="civic-hero"><small>CLEAR STEPS. NO GUESSWORK.</small><h2>Permits should feel<br>like public service.</h2><p>Understand what you need, prepare a draft, and stay in control before anything is submitted.</p></section>
      <div class="civic-grid">
        <form id="permitCheck" class="permit-card"><span class="step">01</span><h3>Check requirements</h3><p>Get the exact documents, timing, and public fees.</p><label>Permit type<select name="permitType"><option value="street-event">Street event</option><option value="home-renovation">Home renovation</option><option value="food-stall">Food stall</option></select></label><label>Expected participants<input name="applicants" type="number" min="1" max="1000" value="80"></label><button>Show requirements</button></form>
        <form id="permitDraft" class="permit-card"><span class="step">02</span><h3>Prepare a draft</h3><p>Nothing is submitted. You review every field first.</p><label>Your name<input name="applicantName" value="Maya Chen"></label><label>Summary<textarea name="summary">A neighborhood repair fair with local volunteers and workshops.</textarea></label><input name="permitType" type="hidden" value="street-event"><button>Prepare draft</button></form>
      </div>
      <div id="permitOutput" class="permit-output ${state.permit ? "visible" : ""}">${state.permit ? `<b>Draft ready for ${escapeHtml(state.permit.applicantName || "review")}</b><span>${escapeHtml(state.permit.summary || state.permit.message)}</span><button>Review, do not submit →</button>` : ""}</div>
    </div>`;
  el("permitCheck").addEventListener("submit", (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); runAction("check_permit_requirements", { ...data, applicants: Number(data.applicants) }, "human"); });
  el("permitDraft").addEventListener("submit", (event) => { event.preventDefault(); runAction("prepare_permit_draft", Object.fromEntries(new FormData(event.currentTarget)), "human"); });
}

function renderExternal() {
  const safe = escapeHtml(state.address);
  viewport.innerHTML = `<div class="external-frame-wrap"><div class="boundary-banner"><b>External origin</b><span>This site may block embedding. Bridge Studio will not inspect credentials or bypass browser security.</span></div><iframe title="External website preview" src="${safe}" sandbox="allow-forms allow-modals allow-popups allow-scripts allow-same-origin"></iframe><div class="frame-fallback"><b>Preview blocked?</b><span>Many websites prevent embedding. Use one of the complete demo sites to test semantic tool generation.</span><button data-demo="demo://voyager-stays">Open Voyager demo</button><button data-demo="demo://civic-desk">Open Civic demo</button></div></div>`;
  viewport.querySelectorAll("[data-demo]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.demo)));
}

function renderTools() {
  const candidates = currentSite()?.candidates || [];
  el("discoveryStatus").textContent = candidates.length ? `${candidates.length} found` : "Origin guarded";
  el("candidateTools").innerHTML = candidates.map((tool) => `
    <article class="tool-card ${state.active.has(tool.name) ? "approved" : ""}">
      <div class="tool-icon">${tool.risk === "read" ? "↗" : "✦"}</div><div class="tool-main"><div><h3>${tool.title}</h3><span class="risk ${tool.risk}">${tool.risk === "read" ? "READ ONLY" : "CHANGES STATE"}</span></div><code>${tool.name}</code><p>${tool.description}</p></div>
      <button data-approve="${tool.name}" ${state.active.has(tool.name) ? "disabled" : ""}>${state.active.has(tool.name) ? "Approved" : "Review"}</button>
    </article>`).join("") || `<div class="empty-state"><span>◇</span><b>Cross-origin boundary respected</b><p>Open a demo site to discover workflows, or use this preview without exposing its private DOM.</p></div>`;
  el("candidateTools").querySelectorAll("[data-approve]").forEach((button) => button.addEventListener("click", () => openApproval(candidates.find((tool) => tool.name === button.dataset.approve))));
  el("activeTools").innerHTML = [...state.active.values()].map((tool) => `<article class="active-tool"><span class="active-dot"></span><div><b>${tool.name}</b><small>${tool.risk === "read" ? "Read only" : "Human approved write"}</small></div><button data-revoke="${tool.name}" aria-label="Revoke ${tool.name}">×</button></article>`).join("") || `<p class="active-empty">No page tools approved yet.</p>`;
  el("activeTools").querySelectorAll("[data-revoke]").forEach((button) => button.addEventListener("click", () => revokeTool(button.dataset.revoke)));
  el("toolCount").textContent = `${state.active.size} active`;
}

function renderTrace() {
  el("traceList").innerHTML = state.traces.map((entry) => `<li class="trace-${entry.kind}"><span>${entry.time}</span><div><b>${escapeHtml(entry.message)}</b><small>${escapeHtml(entry.detail)}</small></div></li>`).join("") || `<li class="trace-empty">Actions from people and agents will appear here.</li>`;
}

function openApproval(tool) {
  pendingApproval = tool;
  el("approvalTitle").textContent = tool.title;
  el("approvalDescription").textContent = tool.description;
  el("approvalSchema").innerHTML = `<div><span>Tool name</span><code>${tool.name}</code></div><div><span>Permission</span><b>${tool.risk === "read" ? "Read-only" : "Changes page state"}</b></div><div><span>Required inputs</span><code>${(tool.inputSchema.required || []).join(", ") || "None"}</code></div>`;
  el("approvalCheck").checked = false;
  el("confirmApproval").disabled = true;
  approvalDialog.showModal();
}

async function approveTool(tool) {
  const controller = new AbortController();
  const definition = {
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    annotations: toolAnnotations(tool),
    execute: async (input) => runAction(tool.name, input, "agent")
  };
  if (document.modelContext?.registerTool) {
    await document.modelContext.registerTool(definition, { signal: controller.signal });
    state.aborters.set(tool.name, controller);
  }
  state.active.set(tool.name, tool);
  trace("approve", "Tool approved", tool.name);
  renderTools();
  toast(`${tool.name} is available to your agent`);
}

function revokeTool(name) {
  state.aborters.get(name)?.abort();
  state.aborters.delete(name);
  state.active.delete(name);
  trace("revoke", "Tool revoked", name);
  renderTools();
}

function findTool(name) {
  return Object.values(SITE_DEFINITIONS).flatMap((site) => site.candidates).find((tool) => tool.name === name);
}

async function runAction(name, input, actor) {
  const tool = findTool(name);
  if (!tool) return JSON.stringify({ ok: false, error: "Unknown tool" });
  const error = validateToolInput(tool.inputSchema, input);
  if (error) { trace("error", `${name} rejected`, error); return JSON.stringify({ ok: false, error }); }
  if (actor === "agent" && !state.active.has(name)) return JSON.stringify({ ok: false, error: "Tool is not approved" });
  if (name === "search_stays") {
    state.results = input;
    if (state.address !== "demo://voyager-stays") navigate("demo://voyager-stays"); else renderPage();
    trace(actor, `${actor === "agent" ? "Agent" : "Human"} searched stays`, `${input.destination} · ${input.guests} guest${input.guests === 1 ? "" : "s"}`);
    return JSON.stringify({ ok: true, visibleResults: 3, destination: input.destination, message: "The shared results view has been updated." });
  }
  if (name === "shortlist_stay") {
    state.shortlist.add(input.propertyId);
    renderPage();
    trace(actor, `${actor === "agent" ? "Agent" : "Human"} updated shortlist`, input.propertyId);
    return JSON.stringify({ ok: true, shortlisted: input.propertyId, message: "Saved visibly; no booking was made." });
  }
  if (name === "check_permit_requirements") {
    state.permit = { message: `${input.permitType}: identity document, site plan, safety contact · estimated public fee $45–$120.` };
    if (state.address !== "demo://civic-desk") navigate("demo://civic-desk"); else renderPage();
    trace(actor, "Permit requirements checked", input.permitType);
    return JSON.stringify({ ok: true, documents: ["Identity document", "Site plan", "Safety contact"], feeRange: "$45–$120", message: "Requirements are visible in the shared workspace." });
  }
  if (name === "prepare_permit_draft") {
    state.permit = input;
    if (state.address !== "demo://civic-desk") navigate("demo://civic-desk"); else renderPage();
    trace(actor, "Permit draft prepared", "Review required — not submitted");
    return JSON.stringify({ ok: true, status: "draft", submitted: false, message: "A visible editable draft was prepared. Human review is required." });
  }
}

async function registerBaseTools() {
  const base = [
    { name: "bridge_navigate", description: "Navigate the shared browser workspace to a URL or demo address. External origins remain security-isolated.", inputSchema: { type: "object", properties: { url: { type: "string" } }, required: ["url"] }, annotations: { readOnlyHint: false, untrustedContentHint: true }, execute: async ({ url }) => { navigate(url); return JSON.stringify({ ok: true, address: state.address, page: currentSite()?.title || "External origin" }); } },
    { name: "bridge_inspect_page", description: "Inspect the current shared page and return candidate semantic workflows without exposing credentials or private cross-origin DOM.", inputSchema: { type: "object", properties: {} }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: async () => { const site = currentSite(); trace("agent", "Agent inspected page", state.address); return JSON.stringify({ address: state.address, title: site?.title || "External origin", boundary: site ? "same-origin demo" : "cross-origin guarded", candidates: site?.candidates.map(({ name, description, risk, inputSchema }) => ({ name, description, risk, inputSchema })) || [] }); } },
    { name: "bridge_get_action_trace", description: "Return the recent visible audit trail of human and agent actions in this workspace.", inputSchema: { type: "object", properties: {} }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: async () => JSON.stringify({ actions: state.traces }) }
  ];
  if (!document.modelContext?.registerTool) return false;
  for (const tool of base) await document.modelContext.registerTool(tool);
  return true;
}

el("addressForm").addEventListener("submit", (event) => { event.preventDefault(); navigate(el("addressInput").value); });
el("backButton").addEventListener("click", () => { if (state.historyIndex > 0) { state.historyIndex--; revokeToolsOutside(state.history[state.historyIndex]); state.address = state.history[state.historyIndex]; el("addressInput").value = state.address; renderPage(); renderTools(); } });
el("forwardButton").addEventListener("click", () => { if (state.historyIndex < state.history.length - 1) { state.historyIndex++; revokeToolsOutside(state.history[state.historyIndex]); state.address = state.history[state.historyIndex]; el("addressInput").value = state.address; renderPage(); renderTools(); } });
el("refreshButton").addEventListener("click", () => { renderPage(); trace("navigate", "Page refreshed", state.address); });
el("inspectButton").addEventListener("click", () => { renderTools(); trace("inspect", "Page capabilities inspected", `${currentSite()?.candidates.length || 0} semantic workflows found`); toast(currentSite() ? "Typed workflows discovered" : "Cross-origin boundary preserved"); });
el("approvalCheck").addEventListener("change", (event) => { el("confirmApproval").disabled = !event.target.checked; });
approvalDialog.addEventListener("close", () => { if (approvalDialog.returnValue === "approve" && pendingApproval) approveTool(pendingApproval); pendingApproval = null; });
el("revokeAllButton").addEventListener("click", () => [...state.active.keys()].forEach(revokeTool));
el("clearTraceButton").addEventListener("click", () => { state.traces = []; renderTrace(); });
el("tourButton").addEventListener("click", () => el("tourDialog").showModal());
el("sessionId").textContent = crypto.randomUUID().slice(0, 8).toUpperCase();

renderPage();
renderTools();
renderTrace();
registerBaseTools().then((native) => {
  el("protocolStatus").innerHTML = `<span class="pulse ${native ? "" : "amber"}"></span>${native ? "WebMCP connected" : "Preview mode · enable WebMCP"}`;
  trace("system", native ? "WebMCP connected" : "Preview mode active", native ? "3 workspace tools registered" : "UI remains fully interactive");
});
