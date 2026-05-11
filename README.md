# SignalVoice Vulnerable Customer Feedback App

A fully working Dockerized React + Node/Express + PostgreSQL customer feedback application created for AppSec demo use.

> **Important:** This project intentionally contains security vulnerabilities. Use it only on your local machine. Do not deploy it to production or any shared environment.

## What it includes

- Public customer feedback form
- PostgreSQL-backed feedback storage
- Administration panel
- Hardcoded admin credentials
- Admin feedback inbox
- Professional React UI
- Docker Compose local build
- Intentional vulnerabilities for SAST/SCA tools

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

- Hardcoded admin credentials in `backend/src/server.js`
- Hardcoded JWT secret in `backend/src/server.js`
- SQL injection patterns in `POST /api/feedback`
- SQL injection patterns in `GET /api/admin/feedback`
- Stored XSS via unsafe React `dangerouslySetInnerHTML`
- Permissive CORS policy
- Vulnerable/old backend dependencies such as `lodash@4.17.11`
- Old PostgreSQL base image via Docker Compose



