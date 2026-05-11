# SignalVoice Vulnerable Customer Feedback App

A fully working Dockerized React + Node/Express + PostgreSQL customer feedback application created for local Snyk / AppSec demo use.

> **Important:** This project intentionally contains security vulnerabilities. Use it only on your local machine for training, demos, or interview preparation. Do not deploy it to production or any shared environment.

## What it includes

- Public customer feedback form
- PostgreSQL-backed feedback storage
- Administration panel
- Hardcoded admin credentials
- Admin feedback inbox
- Professional React UI
- Docker Compose local build
- Intentional vulnerabilities for Snyk findings

## Run locally

```bash
docker compose up --build
```

Open the app:

```text
http://localhost:5173
```

Backend health check:

```text
http://localhost:3001/api/health
```

Admin login:

```text
Username: admin
Password: hideme
```

## Intentional vulnerabilities included

These are included for Snyk Code, Snyk Open Source, and demo storytelling:

- Hardcoded admin credentials in `backend/src/server.js`
- Hardcoded JWT secret in `backend/src/server.js`
- SQL injection patterns in `POST /api/feedback`
- SQL injection patterns in `GET /api/admin/feedback`
- Stored XSS via unsafe React `dangerouslySetInnerHTML`
- Permissive CORS policy
- Vulnerable/old backend dependencies such as `lodash@4.17.11`
- Old PostgreSQL base image via Docker Compose

## Demo narrative

This app works well for a Snyk final-round presentation because it gives you:

1. A realistic customer-facing app.
2. A high-risk administration surface.
3. AI-generated-code discussion points.
4. Findings across code, dependencies, containers, and secrets.
5. A clean business story: customer feedback is sensitive and should be protected.

## Suggested Snyk workflow

```bash
snyk auth
snyk test --all-projects
snyk code test
snyk container test postgres:12
```

You can also connect the GitHub repo to Snyk and enable PR checks.

## Safe remediation talking points

For the interview, explain that the secure version would:

- Move admin credentials and JWT secrets into a secret manager.
- Replace raw SQL string interpolation with parameterized queries.
- Sanitize or encode user-supplied content before rendering.
- Restrict CORS to trusted origins.
- Upgrade vulnerable dependencies.
- Add RBAC and audit logging for admin actions.
