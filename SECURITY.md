# Security Policy

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Instead, use GitHub's private vulnerability reporting:
**[Report a vulnerability](https://github.com/Jfhelin/agentviz-studio/security/advisories/new)**

Include a description of the issue, steps to reproduce, and any known impact.

## Scope

AGENTVIZ STUDIO is a local-only tool -- it starts an HTTP server bound to `localhost` and reads session files from disk. There is no authentication, no cloud backend, and no user data is transmitted anywhere. The relevant attack surface is:

- Local HTTP server (`server.js`) — path traversal, unintended file exposure
- CLI argument handling (`bin/agentviz.js`) — unsafe file path handling
- Dependency vulnerabilities — report via the above channel or open a Dependabot alert
