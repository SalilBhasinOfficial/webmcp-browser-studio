# Security model

Bridge Studio is deliberately conservative:

- External page content is treated as untrusted.
- Cross-origin DOM, cookies, and credentials are never inspected.
- Read-only and state-changing tools are labeled truthfully.
- State-changing page tools require explicit human approval before registration.
- Tool inputs are validated against bounded schemas.
- Permit applications remain drafts; stay shortlists never become bookings.
- Registered page tools can be revoked immediately through an `AbortController`.
- Actions are rendered in a visible audit trail.

The external preview is sandboxed and best-effort. Websites may refuse embedding through their browser security policies. A production compatibility layer would run authorized target sites in isolated ephemeral browser sessions, keep credentials out of model context, and require fresh confirmation for consequential actions.

Security reports may be filed through the repository's GitHub issue tracker. Do not include credentials or personal data in reports.
