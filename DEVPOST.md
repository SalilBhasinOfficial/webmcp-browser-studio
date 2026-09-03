# Devpost submission draft

**Live application:** https://webmcp-six.vercel.app

**Public repository:** https://github.com/SalilBhasinOfficial/webmcp-browser-studio

## Inspiration

The open web will not become agent-native overnight. Today, agents often guess their way through visual interfaces while people struggle to see what the agent understood or changed. We wanted a bridge: a browser workspace where people can inspect, approve, observe, and revoke the capabilities shared with an agent.

## What it does

Bridge Studio discovers meaningful workflows in the currently visible page and turns them into typed WebMCP tool proposals. Each proposal explains its inputs and whether it reads or changes state. A person approves the contract before it is registered. When an agent uses an approved tool, the same interface visibly updates and records the action in an audit trail.

The submission includes travel and public-service workflows, plus a guarded external-origin preview that demonstrates an important boundary: compatibility must not mean bypassing browser security.

## How we built it

The app uses the WebMCP Imperative API through `document.modelContext.registerTool()`. Workspace tools are registered at startup. Page-specific tools are registered dynamically after explicit review and are revoked using abort signals. JSON Schema bounds every input. `readOnlyHint` and `untrustedContentHint` communicate risk to the agent.

The frontend uses standards-based HTML, CSS, and JavaScript with no runtime framework dependency. Node's built-in test runner validates address handling, input schemas, and security annotations.

## Challenges

The hardest design problem was respecting the difference between native site tools and browser automation. Arbitrary pages cannot be safely inspected from another origin. Instead of hiding that constraint, Bridge Studio makes it visible and demonstrates a secure same-origin workflow while outlining the isolated-browser architecture needed for authorized external sites.

## Accomplishments

- A complete human approval → tool registration → agent execution → visible audit loop
- Dynamic tools that update shared application state
- Graceful operation both with and without an experimental WebMCP-enabled browser
- Explicit protections against misleading cross-origin and consequential-action claims

## What we learned

The most valuable WebMCP capability is not automation alone. It is a shared, inspectable contract between a website, a person, and their agent. Trust comes from clear purpose, narrow inputs, honest side-effect metadata, visible execution, and revocation.

## What's next

The next step is an isolated remote-browser worker for domains the user is authorized to automate, followed by a tool-contract compiler, saved organization policies, WebMCP evals, and cryptographically signed action receipts.

## Submission checklist

- [x] Add the final live URL
- [x] Add the public GitHub repository URL
- [ ] Record and publish a public YouTube demo under three minutes with audio
- [ ] Add screenshots
- [ ] Confirm the deployed URL in ChatGPT's in-app browser or Chrome 149+
- [ ] Submit before September 3, 2026 at 1:00 PM PT
