# Bridge Studio

A visible, human-governed browser workspace that turns ordinary web workflows into typed WebMCP tools.

**Live application:** https://webmcp-bridge-studio.vercel.app  
**Public source:** https://github.com/SalilBhasinOfficial/webmcp-browser-studio

Bridge Studio explores a compatibility layer for the web before every site offers native WebMCP. It discovers meaningful workflows, presents their typed contracts and side effects to the user, registers only approved tools, executes them in the shared interface, and preserves an action trace.

## Why WebMCP

Browser agents can actuate buttons and fields, but long click sequences are brittle and obscure. WebMCP lets a site declare purpose directly. Bridge Studio makes that difference tangible: the user and agent share the same page, the same state, and the same evidence of what occurred.

This submission does **not** claim to bypass cross-origin browser security or magically add native support to third-party sites. External pages remain origin-isolated. The included same-origin demo sites show the complete compatibility workflow reliably; a production version would pair this UI with isolated browser infrastructure and explicit domain authorization.

## Features

- Browser-style navigation with two complete interactive demo sites
- Workflow discovery and typed JSON Schema contracts
- Human approval and revocation for dynamically registered tools
- Accurate `readOnlyHint` and `untrustedContentHint` annotations
- Visible human/agent execution in shared page state
- Input validation and bounded parameters
- Live audit trail
- Cross-origin boundary messaging and best-effort external preview
- Responsive, dependency-free frontend
- Graceful preview mode when WebMCP is unavailable

## WebMCP tools

Three workspace tools are registered on load:

- `bridge_navigate`
- `bridge_inspect_page`
- `bridge_get_action_trace`

The user may review and dynamically register:

- `search_stays`
- `shortlist_stay`
- `check_permit_requirements`
- `prepare_permit_draft`

Dynamic registration uses `document.modelContext.registerTool()` with typed input schemas, annotations, cancellation signals, and execution callbacks.

## Run locally

```bash
npm test
npm start
```

Open `http://localhost:4173`. For native tool discovery, use ChatGPT's in-app browser or Chrome with WebMCP testing enabled. In other browsers the full UI works in clearly labeled preview mode.

## Suggested judge walkthrough

1. Open Voyager Stays.
2. Select **Inspect page**.
3. Review and approve `search_stays`.
4. Ask the browser agent to search Lisbon for two guests from October 12–16, 2026.
5. Observe the shared results and action trace update.
6. Navigate to `demo://civic-desk`.
7. Approve `prepare_permit_draft` and ask the agent to prepare—but not submit—a street-event application.
8. Observe the human review checkpoint in the page.

## Security model

See [SECURITY.md](SECURITY.md). No credentials, private data, remote execution, or unrestricted browsing APIs are included.

## License

[MIT](LICENSE)
